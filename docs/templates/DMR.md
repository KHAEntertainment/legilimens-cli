Certainly! Here’s a concise, step-by-step guide for running a Docker Model Runner (DMR) model inside a local TypeScript application, focusing only on the CLI and API workflow:

---

### 1. Check if DMR is Installed

Run:
```sh
docker model version
```
If you see a version, DMR is installed. If you get an error like `docker: 'model' is not a docker command`, DMR is not installed or not linked properly. On Linux, install with:
```sh
sudo apt-get update
sudo apt-get install docker-model-plugin
```
[Get started with DMR](https://docs.docker.com/ai/model-runner/get-started/)  
[Reference: docker model](https://docs.docker.com/reference/cli/docker/model/)

---

### 2. Find the Model(s) to Install

Browse models on [Docker Hub AI Catalog](https://hub.docker.com/u/ai) or search with:
```sh
docker model list
```
(After pulling, this lists local models.)

---

### 3. Pull and Install the Model

To pull a model (e.g., `ai/smollm2`):
```sh
docker model pull ai/smollm2
```
Or for a specific version:
```sh
docker model pull ai/smollm2:360M-Q4_K_M
```
[Get started with DMR](https://docs.docker.com/ai/model-runner/get-started/)

---

### 4. Test the Model

Run a quick prompt:
```sh
docker model run ai/smollm2 "Hello"
```
Or start an interactive chat:
```sh
docker model run ai/smollm2
```
[Reference: docker model run](https://docs.docker.com/reference/cli/docker/model/run/)

---

### 5. Invoke/Use the Model for Completions in Your Application

**Recommended:** Use the OpenAI-compatible REST API provided by DMR.

- **From your TypeScript app**, send HTTP requests to the DMR endpoint.
- By default, the API is available at `http://localhost:12434/` (if using Docker Engine or if TCP is enabled in Docker Desktop).

Example request (using `fetch` in Node.js/TypeScript):
```typescript
const response = await fetch('http://localhost:12434/engines/llama.cpp/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'ai/smollm2',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Tell me a joke.' }
    ]
  })
});
const data = await response.json();
console.log(data);
```
You can connect **directly** to the DMR API from your app—no proxy is required unless you have custom networking needs.  
[DMR REST API Reference](https://docs.docker.com/ai/model-runner/api-reference/)  
[REST API Examples](https://docs.docker.com/ai/model-runner/api-reference/#rest-api-examples)

---

**Summary:**  
- Check/install DMR via CLI.
- Pull models via CLI.
- Test via CLI.
- Use the OpenAI-compatible REST API directly from your TypeScript app.

Let me know if you need a minimal TypeScript example or further details on any step!

Certainly! Here’s a minimal TypeScript example for calling a Docker Model Runner (DMR) model using the OpenAI-compatible REST API, based strictly on the official documentation.

---

### Prerequisites

- DMR is installed and running.
- The model (e.g., `ai/smollm2`) is pulled and available locally.
- TCP support is enabled (default port: `12434`).

---

### TypeScript Example: Call DMR for Chat Completions

```typescript
import fetch from 'node-fetch'; // npm install node-fetch@2

async function getCompletion() {
  const response = await fetch('http://localhost:12434/engines/llama.cpp/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'ai/smollm2',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Tell me a joke.' }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

getCompletion().catch(console.error);
```

- This example uses the OpenAI-compatible `/chat/completions` endpoint as documented for DMR.  
- The endpoint URL and request structure are directly from the official REST API examples, which show how to interact with DMR from a local application using HTTP requests [DMR REST API](https://docs.docker.com/ai/model-runner/api-reference/#rest-api-examples).

---

**Note:**  
- You do not need a proxy; connect directly to `http://localhost:12434/` as shown above.
- If you run your app inside a container, use `http://model-runner.docker.internal/` as the host [DMR REST API](https://docs.docker.com/ai/model-runner/api-reference/).

Let me know if you need further customization!

------

DMR REST API


Once Model Runner is enabled, new API endpoints are available. You can use
these endpoints to interact with a model programmatically.

### Determine the base URL

The base URL to interact with the endpoints depends
on how you run Docker:

{{< tabs >}}
{{< tab name="Docker Desktop">}}

- From containers: `http://model-runner.docker.internal/`
- From host processes: `http://localhost:12434/`, assuming TCP host access is
  enabled on the default port (12434).

{{< /tab >}}
{{< tab name="Docker Engine">}}

- From containers: `http://172.17.0.1:12434/` (with `172.17.0.1` representing the host gateway address)
- From host processes: `http://localhost:12434/`

> [!NOTE]
> The `172.17.0.1` interface may not be available by default to containers
  within a Compose project.
> In this case, add an `extra_hosts` directive to your Compose service YAML:
>
> ```yaml
> extra_hosts:
>   - "model-runner.docker.internal:host-gateway"
> ```
> Then you can access the Docker Model Runner APIs at http://model-runner.docker.internal:12434/

{{< /tab >}}
{{</tabs >}}

### Available DMR endpoints

- Create a model:

  ```text
  POST /models/create
  ```

- List models:

  ```text
  GET /models
  ```

- Get a model:

  ```text
  GET /models/{namespace}/{name}
  ```

- Delete a local model:

  ```text
  DELETE /models/{namespace}/{name}
  ```

### Available OpenAI endpoints

DMR supports the following OpenAI endpoints:

- [List models](https://platform.openai.com/docs/api-reference/models/list):

  ```text
  GET /engines/llama.cpp/v1/models
  ```

- [Retrieve model](https://platform.openai.com/docs/api-reference/models/retrieve):

  ```text
  GET /engines/llama.cpp/v1/models/{namespace}/{name}
  ```

- [List chat completions](https://platform.openai.com/docs/api-reference/chat/list):

  ```text
  POST /engines/llama.cpp/v1/chat/completions
  ```

- [Create completions](https://platform.openai.com/docs/api-reference/completions/create):

  ```text
  POST /engines/llama.cpp/v1/completions
  ```


- [Create embeddings](https://platform.openai.com/docs/api-reference/embeddings/create):

  ```text
  POST /engines/llama.cpp/v1/embeddings
  ```

To call these endpoints via a Unix socket (`/var/run/docker.sock`), prefix their path
with `/exp/vDD4.40`.

> [!NOTE]
> You can omit `llama.cpp` from the path. For example: `POST /engines/v1/chat/completions`.

## REST API examples

### Request from within a container

To call the `chat/completions` OpenAI endpoint from within another container using `curl`:

```bash
#!/bin/sh

curl http://model-runner.docker.internal/engines/llama.cpp/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "ai/smollm2",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant."
            },
            {
                "role": "user",
                "content": "Please write 500 words about the fall of Rome."
            }
        ]
    }'

```

### Request from the host using TCP

To call the `chat/completions` OpenAI endpoint from the host via TCP:

1. Enable the host-side TCP support from the Docker Desktop GUI, or via the [Docker Desktop CLI](/manuals/desktop/features/desktop-cli.md).
   For example: `docker desktop enable model-runner --tcp <port>`.

   If you are running on Windows, also enable GPU-backed inference.
   See [Enable Docker Model Runner](get-started.md#enable-docker-model-runner-in-docker-desktop).

1. Interact with it as documented in the previous section using `localhost` and the correct port.

```bash
#!/bin/sh

  curl http://localhost:12434/engines/llama.cpp/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "ai/smollm2",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant."
            },
            {
                "role": "user",
                "content": "Please write 500 words about the fall of Rome."
            }
        ]
    }'
```

### Request from the host using a Unix socket

To call the `chat/completions` OpenAI endpoint through the Docker socket from the host using `curl`:

```bash
#!/bin/sh

curl --unix-socket $HOME/.docker/run/docker.sock \
    localhost/exp/vDD4.40/engines/llama.cpp/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "ai/smollm2",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant."
            },
            {
                "role": "user",
                "content": "Please write 500 words about the fall of Rome."
            }
        ]
    }'
```



------

