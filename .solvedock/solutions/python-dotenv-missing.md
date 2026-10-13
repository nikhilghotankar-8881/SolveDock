---
id: python-dotenv-001
title: Python dotenv Module Not Found Error
technology:
  - Python
tags:
  - imports
  - virtualenv
  - pip
status: verified
environment: Windows 11, Python 3.11 virtualenv
verifiedAt: 2026-10-13
---

## Problem
ModuleNotFoundError: No module named 'dotenv' when executing python main.py or starting FastAPI server.

## Root Cause
The python-dotenv package was installed in the global Python environment instead of the active project virtual environment (.venv).

## Solution
1. Ensure the virtual environment is activated:
   - Windows PowerShell: `.\.venv\Scripts\Activate.ps1`
   - Linux/macOS: `source .venv/bin/activate`
2. Install the package inside the environment:
   `pip install python-dotenv`
3. Verify with:
   `pip list | findstr dotenv`
