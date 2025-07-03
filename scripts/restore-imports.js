#!/usr/bin/env node

/**
 * 🔄 Backup Restore Script
 * Import 수정이나 중복 제거 작업 전에 생성된 백업을 복원하는 스크립트
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class BackupRestore {
    constructor(backupType = 'imports') {
        this.backupType = backupType;
        this.backupDir = backupType === 'imports' ? '.backup-imports' : '.backup-deduplication';
    }

    /**
     * 사용 가능한 백업 목록 조회
     */
    listBackups() {
        if (!fs.existsSync(this.backupDir)) {
            console.log(chalk.yellow('⚠️  No backup directory found'));
            return [];
        }

        const backups = fs.readdirSync(this.backupDir)
            .filter(file => fs.statSync(path.join(this.backupDir, file)).isFile() || fs.statSync(path.join(this.backupDir, file)).isDirectory())
            .map(file => ({
                name: file,
                path: path.join(this.backupDir, file),
                stats: fs.statSync(path.join(this.backupDir, file))
            }))
            .sort((a, b) => b.stats.mtime - a.stats.mtime);

        return backups;
    }

    /**
     * 백업 복원
     */
    restore(backupName = null) {
        const backups = this.listBackups();
        
        if (backups.length === 0) {
            console.log(chalk.red('❌ No backups found'));
            return false;
        }

        // 백업 선택
        let selectedBackup = backups[0]; // 가장 최근 백업
        if (backupName) {
            selectedBackup = backups.find(b => b.name === backupName);
            if (!selectedBackup) {
                console.log(chalk.red(`❌ Backup '${backupName}' not found`));
                return false;
            }
        }

        console.log(chalk.blue(`🔄 Restoring backup: ${selectedBackup.name}`));

        try {
            if (this.backupType === 'imports') {
                // Import 백업 복원 (개별 파일)
                this.restoreImportBackup(selectedBackup.path);
            } else {
                // 중복 제거 백업 복원 (전체 디렉토리)
                this.restoreDeduplicationBackup(selectedBackup.path);
            }

            console.log(chalk.green('✅ Backup restored successfully'));
            return true;
            
        } catch (error) {
            console.error(chalk.red('❌ Error restoring backup:'), error.message);
            return false;
        }
    }

    /**
     * Import 백업 복원
     */
    restoreImportBackup(backupPath) {
        if (fs.statSync(backupPath).isDirectory()) {
            // 디렉토리인 경우 모든 파일 복원
            const files = fs.readdirSync(backupPath);
            files.forEach(file => {
                const backupFile = path.join(backupPath, file);
                const originalFile = file.replace(/_/g, path.sep);
                
                if (fs.existsSync(originalFile)) {
                    fs.copyFileSync(backupFile, originalFile);
                    console.log(chalk.dim(`  Restored: ${originalFile}`));
                }
            });
        } else {
            // 단일 파일인 경우
            const originalFile = path.basename(backupPath).replace(/_/g, path.sep);
            if (fs.existsSync(originalFile)) {
                fs.copyFileSync(backupPath, originalFile);
                console.log(chalk.dim(`  Restored: ${originalFile}`));
            }
        }
    }

    /**
     * 중복 제거 백업 복원
     */
    restoreDeduplicationBackup(backupPath) {
        const srcDir = 'src';
        
        // 현재 src 디렉토리 삭제
        if (fs.existsSync(srcDir)) {
            this.removeDir(srcDir);
        }
        
        // 백업에서 복원
        this.copyDir(backupPath, srcDir);
    }

    /**
     * 디렉토리 제거
     */
    removeDir(dir) {
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                if (fs.statSync(filePath).isDirectory()) {
                    this.removeDir(filePath);
                } else {
                    fs.unlinkSync(filePath);
                }
            });
            fs.rmdirSync(dir);
        }
    }

    /**
     * 디렉토리 복사
     */
    copyDir(src, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        const files = fs.readdirSync(src);
        files.forEach(file => {
            const srcPath = path.join(src, file);
            const destPath = path.join(dest, file);
            
            if (fs.statSync(srcPath).isDirectory()) {
                this.copyDir(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        });
    }

    /**
     * 백업 목록 출력
     */
    printBackups() {
        const backups = this.listBackups();
        
        if (backups.length === 0) {
            console.log(chalk.yellow('⚠️  No backups found'));
            return;
        }

        console.log(chalk.bold.blue(`📦 Available ${this.backupType} backups:`));
        console.log(chalk.blue('─'.repeat(60)));
        
        backups.forEach((backup, index) => {
            const isLatest = index === 0;
            const date = backup.stats.mtime.toLocaleString();
            const size = this.formatSize(this.getSize(backup.path));
            
            console.log(`${isLatest ? chalk.green('→') : ' '} ${backup.name}`);
            console.log(chalk.dim(`   Created: ${date} | Size: ${size}`));
        });
    }

    /**
     * 크기 계산
     */
    getSize(filePath) {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
            return stats.size;
        } else {
            let totalSize = 0;
            const files = fs.readdirSync(filePath);
            files.forEach(file => {
                totalSize += this.getSize(path.join(filePath, file));
            });
            return totalSize;
        }
    }

    /**
     * 크기 포맷팅
     */
    formatSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// CLI 실행
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    const backupType = args.includes('--deduplication') ? 'deduplication' : 'imports';
    
    const restore = new BackupRestore(backupType);
    
    switch (command) {
        case 'list':
            restore.printBackups();
            break;
        case 'restore': {
            const backupName = args[1];
            restore.restore(backupName);
            break;
        }
        default:
            console.log(chalk.bold.blue('🔄 Backup Restore Tool\n'));
            console.log('Usage:');
            console.log('  node scripts/restore-imports.js list [--deduplication]');
            console.log('  node scripts/restore-imports.js restore [backup-name] [--deduplication]');
            console.log('\nExamples:');
            console.log('  node scripts/restore-imports.js list');
            console.log('  node scripts/restore-imports.js restore');
            console.log('  node scripts/restore-imports.js restore src-2023-12-30T10-00-00-000Z --deduplication');
            break;
    }
}

module.exports = BackupRestore; 