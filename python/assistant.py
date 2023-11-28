import os
import json
from dotenv import load_dotenv
from openai import OpenAI
import time
from IPython.display import display

# Load the environment variables from the .env file in the root.
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)

# Create an OpenAI client
client = OpenAI(
    # defaults to os.environ.get("OPENAI_API_KEY")
    api_key=os.getenv('OPENAI_API_KEY'),
)

# Create an assistant
assistant = client.beta.assistants.create(
    name="Math Tutor",
    instructions="You are a personal math tutor. Answer questions briefly, in a sentence or less.",
    model="gpt-4-1106-preview",
)
print("The assistant object:")
print(assistant)

# Create a thread
thread = client.beta.threads.create()
print("The thread object:")
print(thread)

# Create a run
run = client.beta.threads.runs.create(
    thread_id=thread.id,
    assistant_id=assistant.id,
)
print("The run object:")
print(run)

# Create a loop that checks the run status every 0.5 seconds
def wait_on_run(run, thread):
    while run.status == "queued" or run.status == "in_progress":
        run = client.beta.threads.runs.retrieve(
            thread_id=thread.id,
            run_id=run.id,
        )
        time.sleep(0.5)
    return run

run = wait_on_run(run, thread)
print("Run status:")
print(run.status)

# Get all the messages in the thread
messages = client.beta.threads.messages.list(thread_id=thread.id)
print("All thread messages:")
print(messages)

