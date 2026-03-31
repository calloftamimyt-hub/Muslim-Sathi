import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const buildGradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');

function updateVersion() {
    try {
        // 1. Read package.json
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        let version = packageJson.version;

        // 2. Increment version (patch)
        const versionParts = version.split('.').map(Number);
        versionParts[2] += 1;
        const newVersion = versionParts.join('.');
        
        packageJson.version = newVersion;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log(`✅ package.json version updated to: ${newVersion}`);

        // 3. Update android/app/build.gradle
        if (fs.existsSync(buildGradlePath)) {
            let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

            // Update versionName
            buildGradle = buildGradle.replace(/versionName\s+".*"/, `versionName "${newVersion}"`);

            // Update versionCode (increment)
            const versionCodeMatch = buildGradle.match(/versionCode\s+(\d+)/);
            if (versionCodeMatch) {
                const currentVersionCode = parseInt(versionCodeMatch[1], 10);
                const newVersionCode = currentVersionCode + 1;
                buildGradle = buildGradle.replace(/versionCode\s+\d+/, `versionCode ${newVersionCode}`);
                console.log(`✅ android/app/build.gradle versionCode updated to: ${newVersionCode}`);
            }

            fs.writeFileSync(buildGradlePath, buildGradle);
            console.log(`✅ android/app/build.gradle versionName updated to: ${newVersion}`);
        } else {
            console.warn('⚠️ android/app/build.gradle not found. Skipping Android version update.');
        }

    } catch (error) {
        console.error('❌ Error updating version:', error);
        process.exit(1);
    }
}

updateVersion();
