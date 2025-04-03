# Three.js Dialogue Game

A 3D interactive game built with Three.js featuring character dialogues and speech recognition.

## Features

- 3D environment with character movement
- Interactive NPCs with dialogue system
- Speech recognition support for dialogue interaction
- Language learning features (translation, phonetics)
- Modular code architecture
- Responsive design for desktop and mobile

## Getting Started

### Prerequisites

- Node.js (for the development server)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd three-js-dialogue-game
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

The game will open automatically in your default browser at `http://localhost:8080`.

## Project Structure

```
project/
├── build/              # Three.js compiled library
├── jsm/               # Three.js modules
├── css/               # Stylesheets
├── js/                # JavaScript modules
│   ├── characters/    # Character-related modules
│   ├── dialogue/      # Dialogue system
│   ├── game/          # Game state management
│   ├── input/         # Input handling
│   ├── scene/         # 3D scene setup
│   ├── ui/            # UI components
│   ├── utils/         # Utility functions
│   ├── config.js      # Game configuration
│   └── main.js        # Entry point
├── models/            # 3D models and animations
├── index.html         # Main HTML file
└── package.json       # Project metadata
```

## Game Controls

- **W/A/S/D or Arrow Keys**: Move the player
- **Mouse**: Look around
- **E or Enter**: Interact with characters
- **ESC**: Pause menu

## Speech Recognition

The game includes speech recognition for interacting with NPCs through dialogue. This feature:

- Works in compatible browsers (Chrome, Edge)
- Recognizes spoken responses to dialogue options
- Provides visual feedback during recognition

## Development

The codebase follows a modular approach with clear separation of concerns:

- Character management (loading, animations, behavior)
- Dialogue system (text display, options, speech recognition)
- Game state management (player state, scene objects)
- UI components (dialogue boxes, menus, loading screens)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Three.js for 3D rendering
- Various assets and inspiration sources 