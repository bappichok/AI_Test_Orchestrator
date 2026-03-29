# 🔧 Code Generator - Setup Guide

## ✅ What Was Fixed

### 1. **Framework Selection - Limited to 2 Options**
- ✅ Playwright
- ✅ Selenium Java

### 2. **401 Error - Better Error Handling**
- Added validation before API call
- Better error messages directing you to Integrations
- Shows exactly what's missing (API key, provider, etc.)

---

## 🚀 How to Fix the 401 Error

### The Problem
```
{"success":false,"error":"Request failed with status code 401"}
```

This means your LLM API key is not configured.

### The Solution

**Step 1: Go to Integrations**
1. Click the **🔌 Integrations** button in the sidebar
2. Select an LLM Provider:
   - **OpenAI** (requires API key from https://platform.openai.com/api-keys)
   - **Groq** (free, from https://console.groq.com)
   - **Anthropic** (from https://console.anthropic.com)
   - **Ollama** (local, no key needed)

**Step 2: Add Your API Key**
1. Enter your API key in the Integrations form
2. Click "Save" or "Test Connection"
3. Wait for confirmation

**Step 3: Try Code Generation Again**
1. Go to **Generate Code** page
2. Load test cases
3. Click "Generate Code"

---

## 📋 Step-by-Step Workflow

### 1️⃣ Configure LLM (One time)
- Go to **🔌 Integrations**
- Set up your LLM provider
- Save API key

### 2️⃣ Generate Test Cases
- Go to **🧪 Create Cases**
- Generate test cases from Jira/manual story
- See console message: `✅ Test cases saved to localStorage`

### 3️⃣ Generate Automation Code
- Go to **🤖 Generate Code**
- The page will **automatically load** your test cases and story context from your current session.
- Select your preferred framework (Playwright or Selenium Java).
- Click **⚡ Generate Code**.
- Copy or Download the generated script.

---

## 🐛 Debugging

If you still get errors:

1. **Open Developer Tools**: Press `F12`
2. **Check Console Tab**: Look for error messages
3. **Check Storage**: 
   - Go to **Application** tab
   - Look for `generatedTestCases` in Local Storage
4. **Check Integrations**:
   - Make sure LLM provider is configured
   - Make sure API key is not expired

---

## 🎯 Recommended LLM Providers

| Provider | Cost | API Key | Setup Time |
|----------|------|---------|-----------|
| **Groq** | Free | ✅ Required | 2 min |
| **OpenAI** | $$ | ✅ Required | 5 min |
| **Anthropic** | $$ | ✅ Required | 5 min |
| **Ollama** | Free | ❌ Not needed | 10 min (setup locally) |

---

## ✨ Features Now Available

✅ Only Playwright & Selenium Java frameworks  
✅ Better error messages  
✅ LLM configuration warning  
✅ Clear guidance for setup  
✅ Support for multiple LLM providers  

---

Happy code generation! 🤖
