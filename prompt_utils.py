import os
import json
from typing import Dict

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "prompts")

def load_template(name: str) -> str:
    """Load a prompt template file from the prompts directory.
    The file extension is assumed to be .txt.
    """
    path = os.path.join(TEMPLATE_DIR, f"{name}.txt")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def render_template(template: str, **kwargs) -> str:
    """Render a template using Python's format syntax.
    Placeholders in the template should be of the form {placeholder}.
    """
    return template.format(**kwargs)

def build_agent_prompt(system_role: str, query_prompt: str, context: str, schema: str) -> str:
    """Compose the final prompt for an agent.
    Includes a shared system role, the retrieved context, the task prompt, and the JSON schema.
    """
    shared_system = load_template("shared_system_prompt")
    # shared_system may contain a placeholder {system_role}
    shared_system_filled = shared_system.format(system_role=system_role)
    prompt = f"""{shared_system_filled}\n\nREPORT CONTEXT:\n{context}\n\nTASK:\n{query_prompt}\n\nOUTPUT FORMAT:\nRespond with ONLY valid JSON adhering to this schema:\n{schema}\nDo not include any explanatory text outside the JSON.
"""
    return prompt
