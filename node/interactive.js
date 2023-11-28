const openai = require('openai');
const readline = require('readline');
const dotenv = require('dotenv');
dotenv.config();

// Assistant ID (can be a hard-coded ID)
const MATH_ASSISTANT_ID = 'asst_uMT48tOC8NTv4JKlY2qPzb7G';

// Load the environment variables from the.env file in the root.
require('dotenv').config({ path: '../.env' });

// Create an OpenAI client
const client = new openai({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to submit a message to the assistant
async function submitMessage(assistantId, thread, userMessage) {

  try {
    // Create a message
    const messageResponse = await client.beta.threads.messages.create(
      thread.id, // Thread ID as the first argument
      { role: "user", content: userMessage } // Message data as the second argument
    );

    // Create a run
    const runResponse = await client.beta.threads.runs.create(
      thread.id, // Thread ID as the first argument
      { assistant_id: assistantId } // Assistant ID as part of the second argument
    );

    return runResponse;
  } catch (error) {
    console.error('Error in submitMessage:', error);
    throw error;
  }
}


// Function to get a response from the assistant
async function getResponse(thread) {
  try {
    // Correctly call the list method with thread_id as a direct argument
    const response = await client.beta.threads.messages.list(thread.id);
    return response;
  } catch (error) {
    console.error('Error in getResponse:', error);
    throw error;
  }
}



// Function to wait for the assistant's response with a spinner
async function waitOnRun(run, thread) {
  const spinner = ['|', '/', '—', '\\'];
  let spinnerCount = 0;
  process.stdout.write("\x1B[?25l"); // Hide cursor

  while (run.status === "queued" || run.status === "in_progress") {
    // Spinner visual
    process.stdout.write("\r" + spinner[spinnerCount % spinner.length]);
    spinnerCount++;

    // Check run status
    run = await client.beta.threads.runs.retrieve(
      thread.id, // Thread ID as the first argument
      run.id    // Run ID as the second argument
    );
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  process.stdout.write("\r \r"); // Clear spinner
  process.stdout.write("\x1B[?25h"); // Show cursor

  return run;
}


// Pretty printing helper for the last exchange
function prettyPrint(messages) {
  if (messages.data.length >= 2) {
    const lastAssistantMessage = messages.data[0];
    console.log(`Assistant: ${lastAssistantMessage.content[0].text.value}`);
  }
}

// Main chat loop
async function chatLoop() {
  console.log("Welcome to the Math Assistant Chat. Type 'exit' to quit.");

  const thread = await client.beta.threads.create();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ' // Define the prompt symbol here
  });

  rl.prompt(); // Display the initial prompt when the app loads

  for await (const line of rl) {
    const user_input = line.trim();
    if (user_input.toLowerCase() === 'exit') {
      rl.close();
      break;
    }

    const run = await submitMessage(MATH_ASSISTANT_ID, thread, user_input);
    await waitOnRun(run, thread);
    const responses = await getResponse(thread);
    prettyPrint(responses);

    rl.prompt(); // Re-display the prompt after processing each message
  }
}

chatLoop();
