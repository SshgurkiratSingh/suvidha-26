# Suvidha AI Chatbot - Implementation Guide

## Overview

The Suvidha AI Chatbot is a comprehensive conversational assistant integrated across the entire citizen services portal. It uses AWS Bedrock (Claude AI) with RAG (Retrieval-Augmented Generation), voice support, and function calling to provide intelligent assistance to citizens.

## Features

### 🤖 Core Capabilities

- **Conversational AI**: Natural language understanding powered by AWS Bedrock Claude
- **Knowledge Base**: RAG-based system with embeddings for schemes, policies, tariffs, and FAQs
- **Function Calling**: Access to user data (bills, applications, grievances, profile)
- **Voice Support**: Speech-to-text (AWS Transcribe) and text-to-speech (AWS Polly)
- **Navigation**: Can guide users to specific pages and perform actions
- **Context Awareness**: Maintains conversation history across sessions
- **Multi-language Support**: Integrated with existing language system

### 🎯 What the Chatbot Can Do

1. **Answer Questions**
   - Information about government schemes
   - Policy details and requirements
   - Tariff rates and billing information
   - Procedural guidance (how to apply, pay bills, etc.)

2. **Access User Data**
   - View unpaid bills and amounts due
   - Check application status
   - Review grievance tickets
   - Display profile information

3. **Navigate & Perform Actions**
   - Navigate to specific pages (dashboard, bills, applications, etc.)
   - Check scheme eligibility
   - Provide step-by-step guidance

4. **Voice Interaction**
   - Record voice messages
   - Get audio responses
   - Hands-free operation

## Setup Instructions

### 1. Database Setup

The chatbot schema is already added to Prisma. Run migrations:

```bash
cd backEnd2
npx prisma db push
npx prisma generate
```

### 2. Generate Knowledge Base

Run the knowledge base generator to create embeddings:

```bash
cd backEnd2
node scripts/generate-knowledge-base.js
```

This will:

- Extract all schemes, policies, and tariffs from the database
- Generate embeddings using AWS Bedrock Titan
- Store embeddings in the KnowledgeBase table
- Add common FAQs and service information

**Note**: This process may take 5-10 minutes depending on data volume. Embeddings are rate-limited to avoid API throttling.

### 3. Environment Variables

Ensure these AWS environment variables are set:

```env
# AWS Bedrock Configuration
AWS_BEARER_TOKEN_BEDROCK=your_bearer_token
AWS_BEDROCK_ENDPOINT=https://your-bedrock-endpoint
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=anthropic.claude-v2

# AWS Transcribe (for voice)
AWS_TRANSCRIBE_ENDPOINT=https://your-transcribe-endpoint

# AWS Polly (for text-to-speech)
AWS_POLLY_ENDPOINT=https://your-polly-endpoint
```

### 4. Install Dependencies

Backend already has required packages. For frontend, install if needed:

```bash
cd frontend
npm install axios
```

### 5. Start Services

```bash
# Backend
cd backEnd2
npm start

# Frontend (in another terminal)
cd frontend
npm run dev
```

## Architecture

### Backend Services

#### 1. Embedding Service (`src/services/embedding.js`)

- Generates embeddings using AWS Bedrock Titan Embeddings
- Cosine similarity search for relevant knowledge
- Batch processing with rate limiting

#### 2. Chatbot Service (`src/services/chatbot.js`)

- Main conversational AI engine
- RAG implementation with knowledge base search
- Function calling for user data access
- Integration with AWS Bedrock Claude

#### 3. Voice Service (`src/services/voice.js`)

- Audio transcription (speech-to-text)
- Text-to-speech synthesis
- Voice selection and language detection

#### 4. Chat Routes (`src/routes/chat.js`)

- `/api/chat/message` - Send text message
- `/api/chat/voice` - Send voice message
- `/api/chat/tts` - Convert text to speech
- `/api/chat/history/:conversationId` - Get conversation history
- `/api/chat/conversation` - Create new conversation

### Frontend Components

#### 1. ChatContext (`src/context/ChatContext.jsx`)

- Global chat state management
- Message handling (text and voice)
- Audio recording and playback
- Navigation integration

#### 2. ChatWidget (`src/components/ChatWidget.jsx`)

- Floating chat interface
- Message display with timestamps
- Voice recording controls
- Audio playback for responses

### Database Schema

```prisma
model ChatConversation {
  id            String   @id
  citizenId     String?
  sessionId     String
  isAnonymous   Boolean
  context       Json?
  lastMessageAt DateTime
  messages      ChatMessage[]
}

model ChatMessage {
  id             String   @id
  conversationId String
  role           String   // 'user', 'assistant', 'system'
  content        String
  metadata       Json?
  voiceUrl       String?
  createdAt      DateTime
}

model KnowledgeBase {
  id         String   @id
  category   String   // 'scheme', 'policy', 'tariff', 'faq'
  title      String
  content    String
  metadata   Json?
  embedding  String   // Serialized vector
  sourceUrl  String?
  department String?
  isActive   Boolean
}
```

## Function Calling

The chatbot can execute these functions:

1. **get_user_profile** - Retrieve user profile and service accounts
2. **get_user_bills** - Get bills (filtered by department/status)
3. **get_user_applications** - Get applications and their status
4. **get_user_grievances** - Get grievances and resolution status
5. **get_scheme_details** - Search and retrieve scheme information
6. **check_scheme_eligibility** - Check if user qualifies for a scheme
7. **navigate_to_page** - Navigate to specific pages in the app
8. **search_knowledge_base** - Search for information in knowledge base

Example conversation flow:

```
User: "Do I have any unpaid bills?"
Bot: → calls get_user_bills(isPaid=false)
     → receives bill data
     → responds with formatted bill information
```

## Usage Examples

### For Citizens

**Text Chat:**

1. Click the chat bubble in bottom-right corner
2. Type your question
3. Get instant AI-powered responses

**Voice Chat:**

1. Click microphone icon
2. Speak your question
3. Bot transcribes, processes, and responds with text + audio

**Example Queries:**

- "Show me my unpaid electricity bills"
- "How do I apply for Jal Jeevan Mission scheme?"
- "What's the status of my water connection application?"
- "Take me to my profile page"
- "What documents are needed for PM Awas Yojana?"

### For Developers

**Adding New Knowledge:**

1. Add content to `generate-knowledge-base.js`
2. Run the script to regenerate embeddings
3. Knowledge automatically available to chatbot

**Adding New Functions:**

1. Define function in `ASSISTANT_FUNCTIONS` array
2. Implement handler in `executeFunctionCall`
3. Claude will automatically use it when appropriate

**Customizing Responses:**

- Edit system prompt in `generateAIResponse`
- Adjust RAG parameters (top-k results, similarity threshold)
- Modify function calling logic

## Testing

### Test Embedding Generation

```bash
curl "http://localhost:4000/api/chat/test-embedding?text=Hello"
```

### Test Knowledge Base

```bash
# Check if knowledge base is populated
curl "http://localhost:4000/api/chat/test-embedding"
```

### Test Chat (authenticated)

```bash
curl -X POST http://localhost:4000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "test-conv-1",
    "message": "What schemes are available?"
  }'
```

## Performance Considerations

1. **Embedding Generation**: Takes ~200ms per item with rate limiting
2. **Knowledge Base Search**: Fast with proper indexing (~50ms)
3. **LLM Response**: 1-3 seconds depending on query complexity
4. **Voice Processing**: 2-4 seconds for transcription + synthesis

## Security

- Conversations tied to citizen accounts
- Anonymous conversations not stored permanently
- Voice recordings automatically deleted after processing
- No sensitive data exposed in error messages
- Function calling validates user access rights

## Function Calls Failing

1. Ensure user is authenticated for personalized functions
2. Check Prisma database connection
3. Verify function parameters match schema

## Future Enhancements

- [ ] Multi-turn form filling assistance
- [ ] Proactive notifications and reminders
- [ ] Integration with payment gateway
- [ ] File upload assistance
- [ ] Video call support for complex issues
- [ ] Sentiment analysis for feedback
- [ ] Admin analytics dashboard for chat metrics

## API Reference

### POST /api/chat/message

Send a text message to the chatbot.

**Request:**

```json
{
  "conversationId": "string",
  "message": "string"
}
```

**Response:**

```json
{
  "success": true,
  "response": "string",
  "messageId": "string",
  "requiresAction": false,
  "functionCall": {
    "name": "string",
    "arguments": {},
    "result": {}
  }
}
```

### POST /api/chat/voice

Send a voice message (multipart/form-data).

**Form Data:**

- `audio`: Audio file (webm/wav/mp3)
- `conversationId`: string
- `languageCode`: string (default: "en-US")

**Response:**

```json
{
  "success": true,
  "transcript": "string",
  "response": "string",
  "audioUrl": "string",
  "messageId": "string"
}
```

### POST /api/chat/tts

Convert text to speech.

**Request:**

```json
{
  "text": "string",
  "languageCode": "en-US",
  "voiceId": "Joanna"
}
```

**Response:**

```json
{
  "success": true,
  "audioUrl": "string"
}
```

### GET /api/chat/history/:conversationId

Get conversation history.

**Response:**

```json
{
  "success": true,
  "conversation": {
    "id": "string",
    "createdAt": "datetime",
    "lastMessageAt": "datetime",
    "messages": [
      {
        "id": "string",
        "role": "user|assistant",
        "content": "string",
        "createdAt": "datetime"
      }
    ]
  }
}
```
