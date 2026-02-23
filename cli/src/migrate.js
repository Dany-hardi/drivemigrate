import chalk from 'chalk';
import ora from 'ora';
import { google } from 'googleapis';
import { authenticateAccount } from './auth.js';
import { listFolders, downloadFile, uploadFile, createFolder, listFolderContents } from './driveOps.js';

export async function migrate(options) {
  // Step 1: Auth
  console.log(chalk.bold('Step 1/3 — Connect source account'));
  const source = await authenticateAccount('source');
  console.log(chalk.green(`  ✓ Connected: ${source.email}`));

  console.log(chalk.bold('\nStep 2/3 — Connect destination account'));
  const dest = await authenticateAccount('destination');
  console.log(chalk.green(`  ✓ Connected: ${dest.email}`));

  if (source.email === dest.email) {
    console.error(chalk.red('  ✗ Source and destination cannot be the same account.'));
    process.exit(1);
  }

  const sourceDrive = google.drive({ version: 'v3', auth: source.client });
  const destDrive = google.drive({ version: 'v3', auth: dest.client });

  // Step 3: Select
  console.log(chalk.bold('\nStep 3/3 — Select items to migrate'));
  const folders = await listFolders(sourceDrive);

  if (!folders.length) {
    console.log(chalk.yellow('  No folders found. Nothing to migrate.'));
    process.exit(0);
  }

  let toMigrate = folders;

  if (options.folder) {
    toMigrate = folders.filter(f => f.name.toLowerCase().includes(options.folder.toLowerCase()));
    if (!toMigrate.length) {
      console.error(chalk.red(`  ✗ No folder matching "${options.folder}" found.`));
      process.exit(1);
    }
  } else if (!options.all) {
    console.log('\n  Available folders:\n');
    folders.forEach((f, i) => console.log(`  ${chalk.cyan(i + 1)}. ${f.name}`));
    console.log('\n  Use --all to migrate everything, or --folder <name> to target a specific folder.\n');
    process.exit(0);
  }

  // Run migration
  const stats = { transferred: 0, failed: 0, errors: [] };

  for (const folder of toMigrate) {
    const spinner = ora(`Migrating folder: ${chalk.bold(folder.name)}`).start();
    try {
      const newFolder = await createFolder(destDrive, folder.name, null);
      await migrateFolder(sourceDrive, destDrive, folder.id, newFolder.id, stats, spinner);
      spinner.succeed(`${folder.name} — ${chalk.green(stats.transferred + ' files transferred')}`);
    } catch (err) {
      spinner.fail(`${folder.name} — ${chalk.red(err.message)}`);
    }
  }

  // Summary
  console.log('\n' + chalk.bold('Migration complete!'));
  console.log(`  ${chalk.green('✓')} Transferred: ${chalk.green.bold(stats.transferred)}`);
  console.log(`  ${chalk.red('✗')} Failed:      ${chalk.red.bold(stats.failed)}`);
  if (stats.errors.length) {
    console.log('\n  Failed files:');
    stats.errors.forEach(e => console.log(`  — ${e.file}: ${chalk.red(e.error)}`));
  }
}

async function migrateFolder(sourceDrive, destDrive, srcId, destId, stats, spinner) {
  const { data } = await sourceDrive.files.list({
    q: `'${srcId}' in parents and trashed = false`,
    pageSize: 200,
    fields: 'files(id, name, mimeType)',
  });

  for (const file of data.files || []) {
    spinner.text = `Transferring: ${chalk.dim(file.name)}`;
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      const sub = await createFolder(destDrive, file.name, destId);
      await migrateFolder(sourceDrive, destDrive, file.id, sub.id, stats, spinner);
    } else {
      try {
        const dl = await downloadFile(sourceDrive, file);
        await uploadFile(destDrive, dl, destId);
        stats.transferred++;
      } catch (e) {
        stats.failed++;
        stats.errors.push({ file: file.name, error: e.message });
      }
    }
  }
}
