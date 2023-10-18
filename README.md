# AnoniChat Backend

The AnoniChat Backend is the server-side component of my anonymous chat application built with Node.js, Express, and Socket.io. It follows the Model-View-Controller (MVC) architecture and enables real-time communication through WebSockets.

## Features

- Real-time anonymous chat using WebSocket communication.
- MVC architecture for structured code organization.

## Getting Started

These instructions will help you set up and run the backend locally for development and testing purposes.

### Prerequisites

- Node.js: Make sure you have Node.js and Yarn installed. You can download it from [nodejs.org](https://nodejs.org/).
- A mongo database with replicaset enabled.
- An environment capable of hosting with SSL certificates enabled.

### Installation

1. Clone this repository to your local machine:

   ```bash
   git clone https://github.com/lucaspevidor/anonichat-backend.git
   cd anonymous-chat-backend
   ```

1. Install the project dependencies:

   ```bash
   yarn
   ```

1. Create a `.env` file to store environment variables. Here's an example `.env`:

   ```env
   PORT=3001
   DATABASE_URL="mongodb://<mongo_admin>:<mongo_pass>@<mongo_addr>:<port>/<db_name>?directConnection=true"
   GLOBAL_CHANNEL_ID="652f95aa6ef69e21473e04ad"
   ```

1. Generate the database types and push the schema to the database:

   ```bash
   yarn prisma generate
   yarn prisma db push
   ```

1. Change CORS access origins on the following files:

   ```
   ./src/app.ts
   ./src/socket.ts
   ```

1. Change the domain property to match your environment:

   ```typescript
   // src/controllers/session-controller.ts
   // Line 31
   res.cookie("jwt", token, {
     maxAge: 604800000,
     sameSite: "none",
     secure: true,
     domain: "YOUR_DOMAIN_HERE",
   });

   // Example:
   res.cookie("jwt", token, {
     maxAge: 604800000,
     sameSite: "none",
     secure: true,
     domain: ".lucaspevidor.com",
   });
   ```

1. Start the development server:

   ```bash
   yarn dev
   ```

The backend server should now be running on the specified port (default is 3001) and ready to serve the chat application.

## Contact

If you have questions or need assistance, you can reach me out at lucas.pevidor@gmail.com.
