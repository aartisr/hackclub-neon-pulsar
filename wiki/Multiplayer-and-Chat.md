# Multiplayer and Chat

**Neon Pulsar: Zero-G Arena** is by [Aarti S Ravikumar](https://ai-aarti.com/) with the [PCSS II Robotics Team](https://pcssiirobotics.org/). Return to the [main website](https://pcssiirobotics.org/) or the [Wiki home](https://github.com/aartisr/hackclub-neon-pulsar/wiki).

## Host or join

The host creates a room and shares its full code or invite link. Guests join that room, then choose a team in the lobby. The host starts the match. The host runs the game simulation and sends state updates to guests over WebRTC data connections.

## Chat audiences

- **Everyone** chat is visible to all players in the match. Press **T** on a keyboard.
- **Team** chat is visible only to players on the sender's team. Press **Y** on a keyboard.
- The chat composer also has an Everyone/Team selector and a Send button.

## Team changes and leaving

Use **Menu** or **Esc** during a match to switch teams or choose **Home · Leave Match**. A switch moves the pilot to the new team's starting end. If the pilot carried the disc, it returns to center. A host leaving ends the room for everyone. A guest leaving disconnects only that guest.

A guest who joins an active match spectates until the next round. The host can start a rematch after a team reaches five points.
