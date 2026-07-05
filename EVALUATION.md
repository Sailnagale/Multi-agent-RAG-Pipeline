# Evaluation

## Setup
- **Dataset:** 21 questions ; 20 from FinanceBench (link), 1 custom abstention question.
  Question-type breakdown: 11 extractive, 6 computed, 1 judgment, 3 negative.
- **Documents:** AMD_2022_10K.pdf, AMERICANEXPRESS_2022_10K.pdf, BOEING_2022_10K.pdf, PEPSICO_2022_10K.pdf
- **Models:** Generator (gemma4:e4b), judge (qwen2.5:7b), embedding model (qwen3-embedding).
- **Fixed parameters:** top_k_retrieval=10, top_k_final=5, confidence threshold=0 *(the threshold gates on flashrank scores,  don't exist with
  reranking off. Leaving it on would confound the comparison)*
- **Judge prompt:** 
```
    Please evaluate whether an AI assistant's answer includes the expected information. Score from 1 to 5,
    where 1 means completely incorrect or missing the point, and 5 means correct, clear and extremely helpful for a
    beginner investor.

    IMPORTANT: The expected information below DOES exist. If the AI assistant says it could not find the information
    (e.g. "I couldn't find that in the document"), that is a failure to answer and must score 1.

    Question: {question}
    Expected information: {expected}
    AI assistant answer: {answer}

    Output only the rating from 1 to 5 and nothing else.
```
- **Procedure:** Each configuration was run once and recorded.

## Results
| Config | Chunk size | Rerank | Avg judge score (/5) | Truncated | Judge failures | Runtime (min) |
|---|---|---|---|---|---|---|
| CS250_rerankON | 250 | ON | 3.0 | 0 | 0 | 13.4 |
| CS250_rerankOFF | 250 | OFF | 2.857 | 2 | 0 | 13.2 |
| CS500_rerankON | 500 | ON | 2.952 | 3 | 0 | 13.3 |
| CS500_rerankOFF | 500 | OFF | 3.476 | 7 | 0 | 13.6 |


| Chunk size (words) |Chunk Overlap| Reranking | Judge score (/5) | Accuracy | Runtime (min) |
|---|---|---|---|---|---|
| 250 | 30 | ON  | 3.00 | 60.0% | 13.4 |
| 250 | 30 | OFF | 2.86 | 57.1% | 13.2 |
| 500 | 50 | ON  | 2.95 | 59.0% | 13.6 | 
| 500 | 50 | OFF | 3.48 | 69.5% | 13.3 |

**By question type** 

(CS=250, CO=30, Rerank=ON):
| Question type | n | Score (/5) |
|---|---|---|
| Extractive lookup | 11 | 3.36 |
| Computed metric | 6 | 1.67 |
| Metric-relevance judgment | 1 | 1.00 |
| Negative / abstention | 3 | 5.00 |

(CS=250, CO=30, Rerank=OFF):
| Question type | n | Score (/5) |
|---|---|---|
| Extractive lookup | 11 | 2.64 |
| Computed metric | 6 | 2.67 |
| Metric-relevance judgment | 1 | 1.00 |
| Negative / abstention | 3 | 4.67 |

(CS=500, CO=50, Rerank=ON):

| Question type | n | Score (/5) |
|---|---|---|
| Extractive lookup | 11 | 2.64 |
| Computed metric | 6 | 2.83 |
| Metric-relevance judgment | 1 | 1.00 |
| Negative / abstention | 3 | 5.00 |

(CS=500, CO=50, Rerank=OFF):

| Question type | n | Score (/5) |
|---|---|---|
| Extractive lookup | 11 | 2.91 |
| Computed metric | 6 | 3.83 |
| Metric-relevance judgment | 1 | 3.00 |
| Negative / abstention | 3 | 5.00 |



## Analysis
Overall, the strongest configuration was **CS500_rerankOFF**, which had an average judge score of **3.476/5** and an accuracy of **69.5%**. This suggests that for financial report related RAGs, increasing the chunk size from 250 to 500 words improved the amount of useful context availble to the generator. Financial questions generally require a wide range of information and content which comes in formats such as tables, figures and line items, hence a LLM benefits from larger chunk sizes as they would be provided with more context and information to be able to answer the respective question. 

However, reranking did not constantly improve performance. While in the smaller 250-word chunks, where reranking led to improvement, increasing the judge score from **2.857** to **3.00**, in the larget 250 word chunks, the reranking actually worsened, from **3.476** to **2.952**. This implies that re-ranking is only beneficial when the chunks are short, because the reranker would have a clearer relevance signal, and will struggle with larger chunks due to the larger amount of information causing noise to disrupt this signal.

The question-type breakdown also showed that performance varied strongly by task type. Under the best configuration, **computed metric** questions scores the higher among the main answerable categories, with **3.83/5**, while **extractive lookup** questions scored an average of **2.91/5**. Whilst counterintuitive, the reason why computed questions led to a higher accuracy may be due to the fact that the llm judge is not able to credit incorrect lookup answers, however it is able to give score credit to computed metric answers who take the correct calculation approach, albeit with the wrong values.

The single metric-relevance judgment questino was difficult for most configurations, scoring **1.00/5** in the three settings and only improving to **3.00/5** under **CS500_rerankOFF**. For these question types, the LLM requires a greater context window to infer a correct answer, which makes it intuitive as to why the chunking size of 500 had the improved

Several outputs had to be truncated due to performance constraints of the system that the experiment was run on. Understandably, the most truncated was chunk size 500, as the LLM is fed a larger context and hence is more likely to output a larger response. In spite of this, **CS500_rerankOFF** provides the best performance despite 7 of it's responses being truncated, implying the LLM is not being concise.

Runtime was very similar across all configurations, ranging from about **13.2 to 13.6 minutes**. This means the performance differences were not caused by major runtime differences. Since reranking did not add a clear accuracy benefit, especially for the 500-word chunks, the best practical configuration from this experiment is **CS500_rerankOFF**. It achieved the highest judge score and accuracy while avoiding the extra reranking step.

Overall, the results suggest that financial-report RAG benefits more from preserving sufficient document context than from adding reranking in this setup. Larger chunks likely helped keep financial tables, headings, dates, and units together. Reranking was only slightly helpful for smaller chunks but harmful for larger chunks, probably because the reranker struggled with long, mixed, table-heavy financial passages. For this dataset and model combination, the most reliable configuration was therefore **500-word chunks with 50-word overlap and reranking disabled**.

## Limitations
- LLMs that were used are not state of the art, they are quantised simplified models run on suboptimal hardware
- LLM-as-judge has it's problems. It is subjective and imperfect even with a
  separate judge model. With no constraints, human judgment for each response would be superior.
- 21 questions: Small sub-sample of the question dataset due to performance and time constraints, a larger variety of questions would increase precision.
- End-to-end scores only: no retrieval-level metric (hit@k), so retrieval vs
  generation failures are attributed manually
- Single domain (10-K filings), single embedding model tested

## Future work
In the future, to improve this experimental design, better hardware should be acquired to allow for more industry level evaluation of the RAG, rather than using consumer grade PC hardware. Several optimisations can also be made to the evaluation part of the project, wherein a script could be used to allow for all hyperparameters to automatically be cycled through, rather than manual inputs through the user interafce.