# HalluCheck – AI-Powered Hallucination Detection System

HalluCheck is an AI-powered application designed to identify potentially false or unsupported information in AI-generated content. It analyzes factual claims, evaluates available evidence, and classifies them into three categories: **Supported, Contradicted, and Unverifiable**.

The goal is to help users critically evaluate AI-generated information instead of blindly trusting its responses.

## Key Features

- **Claim Extraction:** Breaks AI-generated responses into individual factual claims.
- **Hallucination Detection:** Classifies claims as Supported, Contradicted, or Unverifiable.
- **Confidence Scoring:** Provides a confidence score for each evaluated claim.
- **Evidence Analysis:** Displays explanations and relevant evidence snippets for each verdict.
- **Trust Score:** Calculates an overall score based on the proportion of supported claims.
- **Verification History:** Stores previous verification reports for later review.
- **JSON Export:** Allows verification results to be exported in structured JSON format.
- **Source-Based Verification:** Supports verification against an optional source document.

## How It Works

1. Enter AI-generated text that needs verification.
2. Optionally provide a source document for evidence-based comparison.
3. The application sends the content to the Gemini API.
4. Gemini analyzes the text, extracts individual factual claims, and assigns a verdict to each claim.
5. HalluCheck displays the verdict, confidence score, explanation, and evidence.
6. The application generates an overall trust score and saves the verification report.

## Verdict Categories

| Verdict | Meaning |
|---|---|
| Supported | The available evidence supports the claim. |
| Contradicted | The available evidence conflicts with the claim. |
| Unverifiable | There is insufficient evidence to confirm or reject the claim. |

## Technology Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express.js
- **AI Integration:** Google Gemini API
- **AI SDK:** Google GenAI SDK
- **Development Environment:** Google AI Studio
- **Data Storage:** Local JSON-based verification history

## Project Structure

```text
Hallu-Check/
│
├── src/                  # Frontend source code
├── public/               # Static assets
├── data/                 # Verification history
├── server.ts             # Express backend and Gemini integration
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Environment variable template
└── .gitignore            # Git ignored files
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Nerkar-Radhika/Hallu-Check.git
```

### 2. Navigate to the project directory

```bash
cd Hallu-Check
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the root directory and add your Gemini API key:

```env
GEMINI_API_KEY=your_api_key_here
```

Never commit your actual API key to GitHub.

### 5. Start the application

```bash
npm run dev
```

The development server runs on:

```text
http://localhost:3000
```

## Future Improvements

- Integrate live web search for stronger evidence verification.
- Improve verification accuracy through multiple reliable sources.
- Add user authentication and persistent cloud-based history.
- Enhance claim-level evidence evaluation.

## Note

HalluCheck uses AI-generated assessments, which may occasionally be incorrect. Its verdicts should be treated as assistance for fact-checking rather than definitive proof.

## Author

**Radhika Nerkar**

[GitHub](https://github.com/Nerkar-Radhika)

[LinkedIn](https://www.linkedin.com/in/radhika-nerkar/)
