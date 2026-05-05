# Lockfile note

The previous `package-lock.json` was an incomplete root-only stub, which caused `npm ci` to fail with many "Missing ... from lock file" errors.

Regenerate it once on a machine with npm registry access:

```bash
npm install
npm run ci
npm run build:ssg
```

Then commit the new `package-lock.json`.

After that, clean installs should work:

```bash
rm -rf node_modules
npm ci
npm run ci
```
