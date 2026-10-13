---
id: docker-sock-001
title: Cannot connect to Docker daemon socket permission denied
technology:
  - Docker
  - Linux
tags:
  - daemon
  - permissions
  - containers
status: reviewed
environment: Ubuntu 22.04 / WSL2 Docker Engine
verifiedAt: 2026-10-13
---

## Problem
docker: Got permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock.

## Root Cause
The current user account has not been added to the local docker user group.

## Solution
1. Add current user to docker group:
   `sudo usermod -aG docker $USER`
2. Apply group update:
   `newgrp docker`
3. Test container run without sudo:
   `docker run hello-world`
