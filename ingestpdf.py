import pymupdf as fitz
import chromadb
import requests
from google import genai
import os
from dotenv import load_dotenv
import json
from config import GEMINI_MODEL_EMBEDDING, CHUNK_SIZE, CHUNK_OVERLAP, BATCH_SIZE
from llm_model import use_embed
from selectolax.lexbor import LexborHTMLParser



load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Loads the pdf and converts it into raw text
def pdf_load(path):
    doc = fitz.open(path)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text()

        # skipping blank pages
        if text.strip():
            pages.append({"page": i + 1, "text": text, "source": path})
    return pages


def html_load(path):
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()
    tree = LexborHTMLParser(html)

    # Remove the tags that selectolex may not remove
    for tag in tree.css("script, style"):
        tag.decompose()
    text = tree.body.text(separator=" ", strip=True)
    
    # HTML is one big page, so we only get one "pages" but
    # output list for consistency
    pages = []
    if text.strip():
        pages.append({"page": 1, "text": text, "source": path})

    print(f"Extracted text length: {len(text)} characters")
    print(f"First 500 chars: {text[:500]}")
    return pages


# Cleans out the \n and chunks out the text into a list of chunks of clean processed text
def chunking_text(pages, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    chunks = []
    for page in pages:
        text = page["text"]
        words = text.split()
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append({
                    "text": chunk,
                    "page": page["page"],
                    "source": page["source"]

                })
    return chunks





def create_embedding_index(file_path, chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP, collection_name="financial_docs", model_embed=GEMINI_MODEL_EMBEDDING):
    
    if file_path.endswith(".pdf"):
        pages = pdf_load(file_path)
    elif file_path.endswith(".html"):
        pages = html_load(file_path)
    print(f"{len(pages)} pages have been loaded\n")

    chunks = chunking_text(pages, chunk_size, chunk_overlap)
    print(f"{len(chunks)} chunks have been created\n")

    # Storing into chroma_db
    client = chromadb.PersistentClient(path="./chroma_db")

    # For multiple pdfs / htmls to be uploaded, we either get or create, don't delete
    try:
        collection = client.get_collection(collection_name)
    except:
        collection = client.create_collection(collection_name)

    # Need to avoid colissions now so use filename + index
    unique_name = os.path.basename(file_path)
    # We now send to the API in batches 
    # Batch size is hard coded and not put into streamlit UI as scaling it depends on hardware limitations
    # Default is 100, if you want to increase or decrease, modify in config.py
    for batch_start in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[batch_start:batch_start + BATCH_SIZE]
        texts = [chunk["text"] for chunk in batch]
        
        print(f"Embedding batch {batch_start//BATCH_SIZE + 1}/{(len(chunks)-1)//BATCH_SIZE + 1}...")
        embeddings = use_embed(texts, model_embed)
        
        ids = [f"{unique_name}_chunk_{batch_start + i}" for i in range(len(batch))]
        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=[{"page": chunk["page"], "source": chunk["source"]} for chunk in batch]
        )

# return the number of chunks for our opttinos
    return len(chunks)

# create_embedding_index("docs\FY26_Q1_Consolidated_Financial_Statements.pdf")
