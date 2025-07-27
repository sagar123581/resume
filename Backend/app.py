from flask import Flask, request, jsonify
#import spacy
import pdfplumber
from docx import Document
import re
#from sentence_transformers import SentenceTransformer, util
import numpy as np
import nltk
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import random
import os
import logging
from flask_cors import CORS
import tempfile

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, supports_credentials=True)

# Initialize NLP components
try:
    nlp = spacy.load("en_core_web_sm")
    sentence_model = SentenceTransformer("all-MiniLM-L6-v2")
    nltk.download("stopwords", quiet=True)
    stop_words = set(stopwords.words("english"))
    logger.info("NLP components initialized successfully")
except Exception as e:
    logger.error(f"Error initializing NLP components: {str(e)}")
    raise

# Technical skills database
TECH_SKILLS = {
    "Data Science": {
        "python", "r", "sql", "tensorflow", "keras", "pytorch", 
        "scikit-learn", "pandas", "numpy", "matplotlib", "seaborn",
        "machine learning", "deep learning", "nlp", "computer vision",
        "statistical analysis", "data visualization", "big data"
    },
    "Software Engineering": {
        "java", "c++", "c#", "javascript", "typescript", "go", "rust",
        "object-oriented programming", "design patterns", "data structures",
        "algorithms", "software architecture", "microservices", "rest api",
        "graphql", "docker", "kubernetes", "aws", "azure", "gcp"
    },
    "Web Development": {
        "html", "css", "javascript", "react", "angular", "vue", "node.js",
        "express", "django", "flask", "spring", "laravel", "php",
        "responsive design", "web accessibility", "seo", "web performance"
    }
}

# Interview video database
INTERVIEW_VIDEOS = {
    "Data Science": [
        ("Data Science Interview Questions", "https://youtu.be/Ji46s5BHdr0"),
        ("Machine Learning Interview Prep", "https://youtu.be/seVxXHi2YMs"),
        ("SQL Interview Questions", "https://youtu.be/9FgfsLa_SmY")
    ],
    "Software Engineering": [
        ("Software Engineer Interview Questions", "https://youtu.be/2HQmjLu-6RQ"),
        ("System Design Interview Prep", "https://youtu.be/DQd_AlIvHUw"),
        ("Coding Interview Tips", "https://youtu.be/oVVdezJ0e7w")
    ],
    "Web Development": [
        ("Frontend Interview Questions", "https://youtu.be/JZK1MZwUyUU"),
        ("JavaScript Interview Prep", "https://youtu.be/CyXLhHQS3KY"),
        ("React Interview Questions", "https://youtu.be/pbczsLkv7Cc")
    ],
    "General": [
        ("Top Interview Tips", "https://youtu.be/y8YH0Qbu5h4"),
        ("Behavioral Interview Questions", "https://youtu.be/yp693O87GmM"),
        ("How to Answer Tell Me About Yourself", "https://youtu.be/UeMmCex9uTU")
    ]
}

def extract_text(file_path):
    try:
        logger.info(f"Extracting text from: {file_path}")
        if file_path.endswith(".pdf"):
            with pdfplumber.open(file_path) as pdf:
                text = "\n".join(page.extract_text() for page in pdf.pages if page.extract_text())
                logger.info(f"Extracted {len(text)} characters from PDF")
                return text
        elif file_path.endswith(".docx"):
            doc = Document(file_path)
            text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
            logger.info(f"Extracted {len(text)} characters from DOCX")
            return text
        else:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
                logger.info(f"Extracted {len(text)} characters from text file")
                return text
    except Exception as e:
        logger.error(f"Error extracting text from {file_path}: {str(e)}")
        return ""

def clean_skill(skill):
    return re.sub(r'[^a-z0-9+# ]', '', skill.lower().strip())

def extract_skills(text):
    try:
        text = text.lower()
        doc = nlp(text)
        skills = set()

        # Extract using NER
        for ent in doc.ents:
            if ent.label_ == "SKILL":
                cleaned = clean_skill(ent.text)
                if cleaned and len(cleaned) > 2:
                    skills.add(cleaned)

        # Match against skill database
        for category, skill_set in TECH_SKILLS.items():
            for skill in skill_set:
                if re.search(rf"\b{re.escape(skill)}\b", text):
                    skills.add(skill)

        # Filter common words
        common_words = {"experience", "work", "project", "team", "ability", 
                       "communication", "time", "management", "document"}
        filtered_skills = {s for s in skills if s not in common_words and s not in stop_words}
        
        logger.info(f"Extracted {len(filtered_skills)} skills")
        return filtered_skills
    except Exception as e:
        logger.error(f"Error extracting skills: {str(e)}")
        return set()

def calculate_similarity(resume_text, jd_text):
    try:
        # Semantic similarity
        logger.info("Calculating semantic similarity")
        resume_embed = sentence_model.encode(resume_text, convert_to_tensor=True)
        jd_embed = sentence_model.encode(jd_text, convert_to_tensor=True)
        semantic_sim = util.pytorch_cos_sim(resume_embed, jd_embed).item()
        logger.info(f"Semantic similarity: {semantic_sim}")

        # TF-IDF similarity
        logger.info("Calculating TF-IDF similarity")
        tfidf = TfidfVectorizer(stop_words="english")
        matrix = tfidf.fit_transform([resume_text, jd_text])
        tfidf_sim = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
        logger.info(f"TF-IDF similarity: {tfidf_sim}")

        # Combined score
        combined_score = (semantic_sim * 0.7) + (tfidf_sim * 0.3)
        logger.info(f"Combined similarity score: {combined_score}")
        return combined_score
    except Exception as e:
        logger.error(f"Error calculating similarity: {str(e)}")
        return 0.0

def get_interview_videos(field):
    try:
        field_videos = INTERVIEW_VIDEOS.get(field, [])
        general_videos = INTERVIEW_VIDEOS["General"]
        selected = random.sample(field_videos, min(2, len(field_videos))) + random.sample(general_videos, 1)
        logger.info(f"Selected {len(selected)} interview videos for field: {field}")
        return selected
    except Exception as e:
        logger.error(f"Error selecting interview videos: {str(e)}")
        return []

def calculate_ats_score(resume_path, jd_path):
    try:
        logger.info("Starting ATS score calculation")
        
        resume_text = extract_text(resume_path)
        jd_text = extract_text(jd_path)

        if not resume_text or not jd_text:
            logger.error("Empty text extracted from one or both files")
            return {"error": "Text extraction failed"}

        resume_skills = extract_skills(resume_text)
        jd_skills = extract_skills(jd_text)

        similarity_score = calculate_similarity(resume_text, jd_text)
        matched_skills = resume_skills & jd_skills
        skill_match = len(matched_skills) / len(jd_skills) if jd_skills else 0

        field_scores = {field: len(resume_skills & skills) for field, skills in TECH_SKILLS.items()}
        primary_field = max(field_scores, key=field_scores.get) if field_scores else "General"
        interview_videos = get_interview_videos(primary_field)
        final_score = (similarity_score * 0.6) + (skill_match * 0.4)

        logger.info(f"Final ATS score: {final_score}")
        logger.info(f"Primary field detected: {primary_field}")
        logger.info(f"Matched skills count: {len(matched_skills)}")
        logger.info(f"Missing skills count: {len(jd_skills - resume_skills)}")

        return {
            "score": round(final_score * 100, 1),
            "similarity": round(similarity_score * 100, 1),
            "skill_match": round(skill_match * 100, 1),
            "matched_skills": sorted(matched_skills),
            "missing_skills": sorted(jd_skills - resume_skills),
            "interview_videos": interview_videos,
            "suggestions": [
                f"Focus on {primary_field} interview preparation",
                "Practice explaining your projects clearly",
                "Review common technical interview questions"
            ]
        }
    except Exception as e:
        logger.error(f"Error in calculate_ats_score: {str(e)}")
        return {"error": "An error occurred during score calculation"}

@app.route('/api/score', methods=['POST'])
def ats_score():
    try:
        import spacy
        from sentence_transformers import SentenceTransformer

        nlp = spacy.load("en_core_web_sm")
        model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
        
        logger.info("Received ATS score request")
        logger.info(f"Request headers: {request.headers}")
        logger.info(f"Request form data: {request.form}")
        logger.info(f"Request files: {request.files}")
        
        if 'resume' not in request.files or 'jd' not in request.files:
            logger.error("Missing files in request")
            return jsonify({"error": "Resume and Job Description files are required"}), 400

        resume_file = request.files['resume']
        jd_file = request.files['jd']

        logger.info(f"Resume file: {resume_file.filename}")
        logger.info(f"JD file: {jd_file.filename}")

        # Validate file extensions
        valid_extensions = ('.pdf', '.docx')
        if not (resume_file.filename.lower().endswith(valid_extensions) and 
                jd_file.filename.lower().endswith(valid_extensions)):
            logger.error("Invalid file types")
            return jsonify({"error": "Only PDF and DOCX files are supported"}), 400

        # Create temporary files
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(resume_file.filename)[1]) as resume_temp:
            resume_path = resume_temp.name
            resume_file.save(resume_path)
            logger.info(f"Saved resume to temporary file: {resume_path}")

        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(jd_file.filename)[1]) as jd_temp:
            jd_path = jd_temp.name
            jd_file.save(jd_path)
            logger.info(f"Saved JD to temporary file: {jd_path}")

        result = calculate_ats_score(resume_path, jd_path)
        logger.info(f"Analysis result: {result}")

        # Clean up
        try:
            os.unlink(resume_path)
            os.unlink(jd_path)
            logger.info("Temporary files removed")
        except Exception as e:
            logger.warning(f"Error removing temporary files: {str(e)}")

        if "error" in result:
            logger.error(f"Error in result: {result['error']}")
            return jsonify({"error": result["error"]}), 500

        response = jsonify({
            "score": result["score"],
            "similarity_score": result["similarity"],
            "skill_match": result["skill_match"],
            "matched_skills": result["matched_skills"],
            "missing_skills": result["missing_skills"],
            "interview_videos": result["interview_videos"],
            "suggestions": result["suggestions"]
        })
        
        logger.info(f"Response prepared: {response.get_data()}")
        return response

    except Exception as e:
        logger.error(f"Unexpected error in API endpoint: {str(e)}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
