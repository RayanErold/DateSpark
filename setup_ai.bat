@echo off
echo Setting up DateSpark AI Microservice...
cd backend/ai_service
python -m venv venv
call venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
echo Setup complete. Run "python main.py" to start the AI service.
pause
