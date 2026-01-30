// Simple test function to verify BAML setup works end-to-end

class GreetingResponse {
  message string
  timestamp string
}

// A minimal function that demonstrates the BAML pipeline working
function SayHello(name: string) -> GreetingResponse {
  client CustomSonnet4
  prompt #"
    Given the name: {{ name }}

    Create a friendly greeting message and include the current timestamp.

    {{ ctx.output_format }}
  "#
}

// Test case to verify the function works
test hello_world {
  functions [SayHello]
  args {
    name "BAML"
  }
}
