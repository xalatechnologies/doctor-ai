# Contributing to Doctor AI

We love your input! We want to make contributing to Doctor AI as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repo and create your branch from `develop`:
   ```bash
   git checkout -b feature/amazing-feature develop
   ```

2. Follow our coding standards:
   - Use TypeScript for all code
   - Follow the [NestJS style guide](https://docs.nestjs.com/guidelines)
   - Maintain existing code style
   - Add JSDoc comments for public APIs
   - Use meaningful variable and function names

3. Ensure your code passes all tests:
   ```bash
   npm run test:all      # Run all tests
   npm run lint          # Check code style
   npm run build         # Verify build
   ```

4. Update documentation if needed:
   - README.md for user-facing changes
   - API documentation for endpoint changes
   - JSDoc comments for code changes
   - Update CHANGELOG.md

5. Create a pull request:
   - Use a clear and descriptive title
   - Reference any related issues
   - Describe your changes in detail
   - List any dependencies added
   - Include screenshots for UI changes

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

\`\`\`
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
\`\`\`

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation only
- style: Code style changes
- refactor: Code changes that neither fix bugs nor add features
- perf: Performance improvements
- test: Adding or modifying tests
- chore: Maintenance tasks

Example:
\`\`\`
feat(symptom-analysis): add support for pediatric symptoms

- Added age-specific symptom validation
- Updated risk assessment algorithm
- Added pediatric-specific recommendations

Closes #123
\`\`\`

## Code Review Process

The core team looks at Pull Requests on a regular basis:
1. Initial review within 2 business days
2. Feedback and requested changes if needed
3. Secondary review after changes
4. Merge approval

## Testing Guidelines

### Unit Tests
- Write tests for all new code
- Maintain existing test coverage
- Use meaningful test descriptions
- Follow AAA pattern (Arrange-Act-Assert)

Example:
\`\`\`typescript
describe('SymptomAnalysisService', () => {
  describe('assessRisk', () => {
    it('should correctly assess high-risk symptoms', async () => {
      // Arrange
      const symptoms = ['chest_pain', 'shortness_of_breath'];
      const age = 65;

      // Act
      const result = await service.assessRisk({ symptoms, age });

      // Assert
      expect(result.riskLevel).toBe('HIGH');
      expect(result.recommendations).toContain('Seek immediate medical attention');
    });
  });
});
\`\`\`

### Integration Tests
- Test service interactions
- Verify database operations
- Test API endpoints
- Check error handling

### E2E Tests
- Cover critical user flows
- Test authentication
- Verify data persistence
- Check performance metrics

## Setting Up Development Environment

1. **Prerequisites:**
   - Node.js v18+
   - Docker and Docker Compose
   - Git
   - IDE (VS Code recommended)

2. **Recommended VS Code Extensions:**
   - ESLint
   - Prettier
   - Docker
   - Jest Runner
   - GitLens

3. **Environment Setup:**
   ```bash
   # Clone repository
   git clone https://github.com/your-username/doctor-ai.git
   cd doctor-ai

   # Install dependencies
   npm install

   # Set up pre-commit hooks
   npm run prepare

   # Start development environment
   docker-compose up -d
   npm run start:dev
   ```

## Community

- Join our [Discord server](https://discord.gg/doctor-ai)
- Follow us on [Twitter](https://twitter.com/doctor_ai)
- Read our [blog](https://blog.doctor-ai.dev)

## License

By contributing, you agree that your contributions will be licensed under the MIT License. 