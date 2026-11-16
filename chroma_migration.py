"""
ChromaDB Collection Dimension Migration & Auto-Alignment Engine
Ensures all collections and query embeddings strictly match the Gemini embedding dimension (3072).
Preserves original documents, chunks, and metadata during safe migration.
Avoids unnecessary regeneration if collections already match.
"""

import os
import chromadb
from typing import Optional, Dict, Any, List
from config import CHROMA_PATH, GEMINI_MODEL_EMBEDDING, TARGET_EMBEDDING_DIM, BATCH_SIZE
from llm_model import use_embed


def get_collection_dimension(collection) -> Optional[int]:
    """
    Returns the vector dimension of a ChromaDB collection by inspecting its stored embeddings or metadata.
    """
    try:
        # Check metadata first
        if hasattr(collection, "metadata") and collection.metadata and "dimension" in collection.metadata:
            try:
                return int(collection.metadata["dimension"])
            except Exception:
                pass

        # Peek at stored embeddings
        peek = collection.peek(1)
        if peek and "embeddings" in peek and peek["embeddings"] is not None:
            embs = peek["embeddings"]
            if len(embs) > 0 and embs[0] is not None and len(embs[0]) > 0:
                return len(embs[0])
    except Exception as e:
        print(f"Warning: could not inspect dimension for collection {getattr(collection, 'name', collection)}: {e}")
    return None


def migrate_collection(client: Optional[chromadb.PersistentClient] = None, collection_name: str = "", 
                       target_model: str = GEMINI_MODEL_EMBEDDING, 
                       target_dim: int = TARGET_EMBEDDING_DIM):
    """
    Safely migrates a collection:
    1. Extracts all original document chunks, IDs, and metadatas.
    2. Regenerates embeddings using the target Gemini embedding model (3072 dimensions).
    3. Recreates the collection with the target dimension.
    4. Re-inserts all preserved documents and metadatas with the new matching embeddings.
    """
    if client is None:
        client = chromadb.PersistentClient(path=CHROMA_PATH)
    print(f"--> [Migration] Re-embedding and migrating collection '{collection_name}' to {target_dim} dimensions...")
    try:
        old_col = client.get_collection(collection_name)
    except Exception as e:
        print(f"Collection '{collection_name}' does not exist to migrate: {e}")
        return client.create_collection(
            name=collection_name, 
            metadata={"embedding_model": target_model, "dimension": target_dim}
        )

    # 1. Preserve all existing documents, IDs, and metadatas
    data = old_col.get(include=["documents", "metadatas"])
    ids: List[str] = data.get("ids", [])
    documents: List[str] = data.get("documents", [])
    metadatas: List[Dict[str, Any]] = data.get("metadatas", [])

    total_docs = len(documents)
    new_embeddings: List[List[float]] = []

    # 2. Re-ingest and regenerate embeddings if documents exist
    if total_docs > 0:
        print(f"--> [Migration] Regenerating embeddings for {total_docs} document chunks using {target_model} ({target_dim} dim)...")
        for b_start in range(0, total_docs, BATCH_SIZE):
            b_docs = documents[b_start : b_start + BATCH_SIZE]
            b_embs = use_embed(b_docs, model_embed=target_model)
            new_embeddings.extend(b_embs)

    # 3. Safely delete the old mismatched collection
    try:
        client.delete_collection(name=collection_name)
    except Exception as del_err:
        print(f"Warning deleting old collection '{collection_name}': {del_err}")

    # 4. Recreate collection with correct metadata and dimension
    new_col = client.create_collection(
        name=collection_name,
        metadata={"embedding_model": target_model, "dimension": target_dim}
    )

    # 5. Re-insert preserved documents, IDs, and metadatas with regenerated embeddings
    if total_docs > 0 and len(new_embeddings) == total_docs:
        for b_start in range(0, total_docs, BATCH_SIZE):
            new_col.add(
                ids=ids[b_start : b_start + BATCH_SIZE],
                documents=documents[b_start : b_start + BATCH_SIZE],
                metadatas=metadatas[b_start : b_start + BATCH_SIZE],
                embeddings=new_embeddings[b_start : b_start + BATCH_SIZE]
            )
        print(f"--> [Migration] Successfully migrated collection '{collection_name}' with {total_docs} chunks at {target_dim} dim.")
    else:
        print(f"--> [Migration] Recreated empty collection '{collection_name}' with {target_dim} dim.")

    return new_col


def migrate_collection_if_needed(client: Optional[chromadb.PersistentClient] = None, collection_name: str = "",
                                target_model: str = GEMINI_MODEL_EMBEDDING,
                                target_dim: int = TARGET_EMBEDDING_DIM):
    """
    Checks if a collection exists and verifies its embedding dimension.
    If dimension matches target_dim, returns immediately without re-embedding (Requirement 7).
    If dimension mismatches, executes safe migration (Requirements 3, 4, 5, 8).
    """
    if client is None:
        client = chromadb.PersistentClient(path=CHROMA_PATH)
    try:
        col = client.get_collection(collection_name)
    except Exception:
        # Collection does not exist yet; create with target dim metadata
        return client.create_collection(
            name=collection_name,
            metadata={"embedding_model": target_model, "dimension": target_dim}
        )

    existing_dim = get_collection_dimension(col)

    # If count is 0, ensure metadata is correct
    if col.count() == 0:
        if existing_dim != target_dim:
            client.delete_collection(name=collection_name)
            return client.create_collection(
                name=collection_name,
                metadata={"embedding_model": target_model, "dimension": target_dim}
            )
        return col

    # Check dimension match
    if existing_dim == target_dim:
        # Exactly matches target; no regeneration needed!
        return col

    print(f"Dimension mismatch in collection '{collection_name}': existing {existing_dim} != target {target_dim}. Triggering migration...")
    return migrate_collection(client, collection_name, target_model, target_dim)


def migrate_all_collections(target_model: str = GEMINI_MODEL_EMBEDDING, 
                            target_dim: int = TARGET_EMBEDDING_DIM) -> Dict[str, Any]:
    """
    Scans all existing ChromaDB collections in CHROMA_PATH.
    Migrates collections with dimension mismatches (e.g. 384 -> 3072).
    Skips collections that already have the matching dimension.
    """
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    try:
        all_cols = client.list_collections()
    except Exception as e:
        print(f"Error listing collections for migration: {e}")
        return {"migrated": [], "skipped": [], "errors": [str(e)]}

    migrated = []
    skipped = []
    errors = []

    for col in all_cols:
        col_name = col.name if hasattr(col, "name") else str(col)
        try:
            c = client.get_collection(col_name)
            dim = get_collection_dimension(c)
            if dim == target_dim:
                skipped.append(col_name)
            else:
                migrate_collection(client, col_name, target_model, target_dim)
                migrated.append(col_name)
        except Exception as err:
            print(f"Error during migration check for '{col_name}': {err}")
            errors.append(f"{col_name}: {err}")

    summary = {
        "migrated": migrated,
        "skipped": skipped,
        "errors": errors,
        "total_inspected": len(all_cols)
    }
    if migrated:
        print(f"--> [ChromaDB Migration Summary] Migrated {len(migrated)} collections to {target_dim} dim: {migrated}")
    return summary
