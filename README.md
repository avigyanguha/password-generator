# Password Generator

A client-side password generator built with React, TypeScript, Vite, and Tailwind CSS.
It creates passwords directly in the browser and lets you adjust the password length
and character types used.

## Features

- Generate passwords from 6 to 32 characters
- Include or exclude uppercase letters, lowercase letters, numbers, and symbols
- View a password-strength estimate as settings change
- Copy the generated password to the clipboard
- Regenerate a password without changing the current settings
- Responsive interface with animated visual styling

## Getting Started

The current React application is in the `new_version` directory.

```bash
cd new_version
npm install
npm run dev
```

Open the local URL shown by Vite in your browser.

## Available Scripts

Run these commands from `new_version`:

```bash
npm run dev       # Start the development server
npm run build     # Type-check and create a production build
npm run lint      # Check the source code with ESLint
npm run preview   # Preview the production build locally
```

## Project Structure

```text
new_version/
	src/
		App.tsx       # Password generator interface and logic
		index.css     # Layout, controls, and visual styling
		main.tsx      # Application entry point
old_version/      # Earlier HTML, CSS, and JavaScript implementation
```

All password generation happens locally in the browser. The app does not send generated
passwords to a server. For high-security or production credential management, use a
cryptographically secure password manager or generator.
