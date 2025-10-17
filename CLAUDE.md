# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Obsidian plugin called "Talk with AI" that enables conversational AI interactions within Obsidian notes using the OpenAI API. The plugin allows users to have structured Q&A conversations with AI models directly in their markdown notes.

## Development Commands

### Build and Development
- **Development mode with watch**: `npm run dev`
  - Compiles TypeScript and watches for changes
  - Uses esbuild for fast compilation

- **Production build**: `npm run build`
  - Runs TypeScript type checking with `tsc -noEmit -skipLibCheck`
  - Creates optimized production build

- **Run tests**: `npm test`
  - Executes Jest test suite for utility functions

### Version Management
- **Bump version**: `npm version patch|minor|major`
  - Updates version in manifest.json and package.json
  - Adds entry to versions.json

## Architecture

### Conversation Format
The plugin uses a specific markdown format to structure conversations:

```
# Q
#### [user question]

---
# A
[AI response]

---
# Q
#### [next user question]
```

- Questions are prefixed with `# Q` and `#### `
- AI responses are prefixed with `# A`
- Sections are separated by `---`
- Simple questions (without the structured format) are automatically detected and treated as standalone queries

### Core Components

**main.ts**
- Plugin entry point and Obsidian API integration
- Defines two commands:
  - "Talk with AI": Sends the conversation to OpenAI and streams the response
  - "Delete last answer": Removes the most recent AI response
- Settings management for API key, model selection, and system prompt
- Implements streaming response with Fibonacci-based buffer frequency for smooth rendering

**utils.ts**
- `getConversationTexts()`: Parses markdown into conversation messages
- `getMessages()`: Converts text array to OpenAI message format (alternating user/assistant roles)
- `getSystemPrompt()`: Wraps the custom system prompt with instructions to not mention the prompt
- `getFormattedText()`: Converts message array back to the structured markdown format
- `isSimpleQuestion()`: Detects if text lacks conversation structure

**modelOptions.json**
- Contains available OpenAI model choices displayed in the settings dropdown
- Format: `{ "model-id": "Display Name (description)" }`
- Currently configured for GPT-5 series models

### Settings
Three configurable settings stored in `data.json`:
1. **apiKey**: OpenAI API key (stored as password field)
2. **model**: Selected OpenAI model (default: "chatgpt-4o-latest")
3. **systemPrompt**: Custom system instructions for the AI

### Streaming Mechanism
The plugin uses an unusual Fibonacci-based streaming approach (`gen()` function in utils.ts):
- Chunks are buffered and rendered at intervals: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584 tokens
- This creates increasingly larger updates as the response continues
- The `formatBuffer()` function removes internal `---` separators from the streamed content

### Testing
Tests in `utils.test.ts` cover:
- Simple question detection
- Conversation text parsing with various formats
- Formatted text generation
- Edge cases with separators in content

## Development Notes

- The plugin allows browser-based OpenAI API calls (`dangerouslyAllowBrowser: true`)
- Questions must have odd message count (last message is user's question)
- When streaming starts, the original text is replaced with formatted conversation plus a new `# A` section
- After response completes, a new `# Q` section is automatically appended for the next question
