# Git Workflow

Development workflow and branching strategy for Streamify.

## Branching Strategy

We follow a **Git Flow** inspired workflow with the following branches:

### Main Branches

- **`master`** - Production-ready code
  - Always stable and deployable
  - Protected branch (requires PR approval)
  - Tagged with version numbers

- **`develop`** - Integration branch for features
  - Latest development changes
  - Base branch for feature branches
  - Merged to master for releases

### Supporting Branches

- **`feature/*`** - New features
  - Branch from: `develop`
  - Merge to: `develop`
  - Naming: `feature/user-authentication`, `feature/movie-recommendations`

- **`bugfix/*`** - Bug fixes
  - Branch from: `develop`
  - Merge to: `develop`
  - Naming: `bugfix/login-error`, `bugfix/search-crash`

- **`hotfix/*`** - Critical production fixes
  - Branch from: `master`
  - Merge to: `master` and `develop`
  - Naming: `hotfix/security-patch`, `hotfix/critical-bug`

- **`release/*`** - Release preparation
  - Branch from: `develop`
  - Merge to: `master` and `develop`
  - Naming: `release/v1.0.0`, `release/v1.1.0`

## Workflow Steps

### 1. Starting New Work

#### Create Feature Branch

```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Push to remote
git push -u origin feature/your-feature-name
```

#### Create Bugfix Branch

```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create bugfix branch
git checkout -b bugfix/issue-description

# Push to remote
git push -u origin bugfix/issue-description
```

### 2. Making Changes

```bash
# Make your changes
# ...

# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add user authentication system"

# Push to remote
git push
```

### 3. Keeping Branch Updated

```bash
# Fetch latest changes
git fetch origin

# Rebase on develop
git rebase origin/develop

# Or merge if you prefer
git merge origin/develop

# Push (force if rebased)
git push --force-with-lease
```

### 4. Creating Pull Request

1. Push your branch to GitHub
2. Go to repository on GitHub
3. Click "New Pull Request"
4. Select base: `develop`, compare: `feature/your-branch`
5. Fill in PR template:
   - Description of changes
   - Related issues
   - Testing done
   - Screenshots (if UI changes)
6. Request review from team members
7. Address review comments
8. Merge when approved

### 5. Merging to Develop

```bash
# After PR approval, merge via GitHub UI
# Or locally:
git checkout develop
git pull origin develop
git merge --no-ff feature/your-feature-name
git push origin develop

# Delete feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

## Commit Message Convention

We follow **Conventional Commits** specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes
- **ci**: CI/CD configuration changes

### Examples

```bash
# Feature
git commit -m "feat(auth): add JWT authentication system"

# Bug fix
git commit -m "fix(movies): resolve pagination issue on movies list"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Refactoring
git commit -m "refactor(api): simplify movie search logic"

# Breaking change
git commit -m "feat(api)!: change authentication endpoint structure

BREAKING CHANGE: /api/login moved to /api/auth/login"
```

## Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Changes Made
- Added user authentication
- Updated API endpoints
- Added tests

## Testing Done
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

## Release Process

### Creating a Release

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# Update version numbers in:
# - package.json
# - backend/app/__init__.py
# - README.md

# Commit version bump
git commit -am "chore(release): bump version to 1.0.0"

# Push release branch
git push -u origin release/v1.0.0
```

### Finalizing Release

```bash
# Merge to master
git checkout master
git merge --no-ff release/v1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin master --tags

# Merge back to develop
git checkout develop
git merge --no-ff release/v1.0.0
git push origin develop

# Delete release branch
git branch -d release/v1.0.0
git push origin --delete release/v1.0.0
```

## Hotfix Process

```bash
# Create hotfix from master
git checkout master
git pull origin master
git checkout -b hotfix/critical-bug

# Make fixes
git commit -am "fix: resolve critical security issue"

# Merge to master
git checkout master
git merge --no-ff hotfix/critical-bug
git tag -a v1.0.1 -m "Hotfix version 1.0.1"
git push origin master --tags

# Merge to develop
git checkout develop
git merge --no-ff hotfix/critical-bug
git push origin develop

# Delete hotfix branch
git branch -d hotfix/critical-bug
git push origin --delete hotfix/critical-bug
```

## Best Practices

### Do's ✅

- **Commit often** with meaningful messages
- **Pull before push** to avoid conflicts
- **Review your changes** before committing
- **Write descriptive PR descriptions**
- **Keep branches focused** on single feature/fix
- **Delete merged branches** to keep repo clean
- **Tag releases** with semantic versioning
- **Test before pushing** to avoid breaking CI

### Don'ts ❌

- **Don't commit directly to master/develop**
- **Don't force push to shared branches**
- **Don't commit sensitive data** (API keys, passwords)
- **Don't commit large binary files**
- **Don't mix unrelated changes** in one commit
- **Don't leave branches unmerged** for long periods
- **Don't ignore merge conflicts**
- **Don't skip code review**

## Git Commands Cheatsheet

### Branch Management

```bash
# List branches
git branch -a

# Create branch
git checkout -b feature/new-feature

# Switch branch
git checkout develop

# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature

# Rename branch
git branch -m old-name new-name
```

### Syncing

```bash
# Fetch changes
git fetch origin

# Pull changes
git pull origin develop

# Push changes
git push origin feature/my-feature

# Force push (use carefully!)
git push --force-with-lease
```

### Undoing Changes

```bash
# Discard local changes
git checkout -- filename

# Unstage file
git reset HEAD filename

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert commit (create new commit)
git revert <commit-hash>
```

### Stashing

```bash
# Stash changes
git stash

# List stashes
git stash list

# Apply stash
git stash apply

# Apply and drop stash
git stash pop

# Drop stash
git stash drop
```

### Viewing History

```bash
# View commit history
git log

# View compact history
git log --oneline

# View branch graph
git log --graph --oneline --all

# View changes in commit
git show <commit-hash>

# View file history
git log -- filename
```

## Troubleshooting

### Merge Conflicts

```bash
# When conflict occurs
git status  # See conflicted files

# Edit files to resolve conflicts
# Look for <<<<<<, ======, >>>>>> markers

# Mark as resolved
git add conflicted-file

# Continue merge
git commit
```

### Accidentally Committed to Wrong Branch

```bash
# Move commit to new branch
git branch feature/correct-branch
git reset --hard HEAD~1
git checkout feature/correct-branch
```

### Need to Update PR

```bash
# Make changes
git add .
git commit -m "fix: address review comments"
git push

# PR automatically updates
```

## Related Documentation

- [Development Setup](Development-Setup.md)
- [Code Style Guide](Code-Style-Guide.md)
- [Testing Guide](Testing-Guide.md)
- [Deployment Guide](Deployment-Guide.md)
