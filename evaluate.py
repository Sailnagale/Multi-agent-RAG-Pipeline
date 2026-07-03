import json
from aiapi import ask
import requests
from google import genai
from config import GEMINI_MODEL_LLM, CONFIDENCE_THRESHOLD, TOP_K_FINAL, TOP_K_RETRIEVAL, GEMINI_MODEL_EMBEDDING
from llm_model import use_model


# Function to take in any golden dataset type and parse it into the JSON template
def parse_golden_dataset(file_content, model_llm=GEMINI_MODEL_LLM):
    prompt = f"""Extract all question and expected answer pairs from the content sent to you.

    STRICT RULES:
    - Only extract pairs EXPLICITLY stated in the contnet
    - Do NOT generate, invent or infer any questions or answers
    - If no clear pairs exist, return an empty array []
    - Even if the question seems irrelevant DO NOT remove it

    Ensure to use this EXACT JSON format and nothing else. 
    [
    {{
        "question": "What was Apple's total net sales for Q1 FY2026?",
        "expected": "143756"
    }}
    ]

    Remember to start and terminate the json too. I want raw text no markdown.

    Content provided: {file_content}
    """

    response = use_model(prompt, model_llm)

    if (model_llm == "gemini-2.5-flash"):
        return json.loads(response.output_text.strip())
    elif (model_llm == "qwen"):
        return json.loads(response["response"].strip())




def llm_as_judge(question, expected, answer, model_llm):
    # Prompt engineering
    prompt = f"""Please evaluate whether an AI assistant's answer includes the expected information. Please score the answer from 1-5,
    where 1 means completely incorrect and missing the point, and 5 means correct, clear and extremely helpful information for a 
    beginner investor.

    Question: {question}
    Expected information: {expected}
    AI assistant answer: {answer}

    

    Ensure to only output the rating from 1-5 and nothing else."""



    response = use_model(prompt, model_llm)

    if (model_llm == "gemini-2.5-flash"):
        print(f"LLM GRADES RESPONSE AS: {response.output_text}")
        return int(response.output_text.strip())
    elif (model_llm == "qwen"):
        print(f"LLM GRADES RESPONSE AS: {response["response"]}")
        return int(response["response"].strip())



def evaluate(golden_dataset, confidence_threshold=CONFIDENCE_THRESHOLD, top_k_retrieval=TOP_K_RETRIEVAL, top_k_final=TOP_K_FINAL,
        model_llm=GEMINI_MODEL_LLM, collection_name="financial_docs", log_name="monitor_log", model_embed=GEMINI_MODEL_EMBEDDING):
    

    results = []
    total_score = 0

    # Note dataset JSON has question expected for each row
    for item in golden_dataset:
        question = item["question"]
        expected = item["expected"]

        score = 0
        # Get the chunks for precision@k

        print(f"Question: {question}")
        answer = ask(question, confidence_threshold, top_k_retrieval, top_k_final, model_llm, 
                     collection_name=collection_name, log_name=log_name, model_embed=model_embed)
        print(f"Answer: {answer}")

        
        score += llm_as_judge(question, expected, answer, model_llm)
        total_score += score


        # Each instance of the test
        results.append({
            "question": question,
            "expected": expected,
            "answer": answer,
            "score": score
        })



    average_score = total_score / len(golden_dataset)
    
    # Return entire thing as dictionary to make it easier
    return {
        "results": results,
        "average_score": average_score,
        "total_questions": len(golden_dataset),
        "total_score": total_score

    }



