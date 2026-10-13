---
id: postgres-conn-001
title: PostgreSQL connection refused on localhost port 5432
technology:
  - PostgreSQL
  - Database
tags:
  - connection
  - socket
  - port
status: verified
environment: Windows 11, PostgreSQL 16
verifiedAt: 2026-10-13
---

## Problem
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: Connection refused.
Cannot connect from backend server to local database.

## Root Cause
The PostgreSQL service daemon was inactive or not running on port 5432.

## Solution
1. Open PowerShell or Command Prompt as Administrator.
2. Check PostgreSQL service status: `Get-Service postgresql*`
3. Start the service: `Start-Service postgresql-x64-16` (or `sudo systemctl start postgresql` on Linux).
4. Verify port is listening with: `netstat -ano | findstr 5432`
