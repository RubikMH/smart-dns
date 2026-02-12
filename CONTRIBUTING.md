# Contributing to Smart DNS

Thank you for your interest in contributing to Smart DNS! This document provides guidelines for contributing to the project.

## How to Contribute

### Reporting Issues
- Use the GitHub issue tracker
- Describe the issue clearly with steps to reproduce
- Include system information (OS, Docker version, etc.)
- Add relevant logs or screenshots

### Suggesting Features
- Open an issue with the "feature request" label
- Describe the feature and its use case
- Explain how it benefits users

### Code Contributions

#### Getting Started
1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/smart-dns.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Commit with clear messages
7. Push to your fork
8. Open a pull request

#### Code Style
- Follow existing code patterns
- Use meaningful variable names
- Comment complex logic
- Keep functions focused and small
- Write self-documenting code

#### Testing
- Test all changes locally
- Verify DNS resolution works
- Check admin panel functionality
- Test with different configurations
- Ensure no breaking changes

#### Pull Request Guidelines
- Reference related issues
- Describe what changes were made and why
- Include testing steps
- Keep PRs focused on a single feature/fix
- Update documentation if needed

## Development Setup

### Prerequisites
- Docker & Docker Compose
- Git
- Node.js (for backend development)
- Basic nginx knowledge

### Local Development
```bash
# Clone the repository
git clone https://github.com/RubikMH/smart-dns.git
cd smart-dns

# Run setup
make setup

# Start services
make start

# View logs
make logs
```

### Project Structure
```
smart-dns/
├── nginx/              # Nginx configurations
├── admin-backend/      # Admin API (Node.js)
├── config/             # Domain lists and configs
├── web/               # Admin UI (HTML/CSS/JS)
├── docs/              # Documentation
└── scripts/           # Helper scripts
```

## Documentation
- Update README.md for user-facing changes
- Update ARCHITECTURE.md for structural changes
- Add inline comments for complex code
- Create new docs/ files for major features

## Commit Messages
Use clear, descriptive commit messages:
```
feat: Add support for custom DNS providers
fix: Resolve GeIP routing issue
docs: Update installation guide
style: Format nginx configuration
refactor: Simplify upstream selection logic
```

## License
By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?
Open an issue for questions or discussion.

Thank you for contributing! 🎉