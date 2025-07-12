#!/usr/bin/env node

/**
 * 🚀 Advanced Import Fixer
 * 잘못된 import 경로를 자동으로 찾아서 올바른 경로로 수정하는 스크립트
 * 
 * 기능:
 * - 깨진 import 자동 감지
 * - 파일 시스템 기반 올바른 경로 추천
 * - 상대/절대 경로 변환
 * - Vue, JS, TS 파일 지원
 * - 백업 및 롤백 기능
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

class ImportFixer {
    constructor(options = {}) {
        this.srcDir = options.srcDir || 'src';
        this.extensions = options.extensions || ['.js', '.vue', '.ts', '.jsx', '.tsx'];
        this.aliases = options.aliases || {
            '@': 'src',
            '@core': 'src/core',
            '@features': 'src/features',
            '@game': 'src/features/game',
            '@websocket': 'src/features/game/multiplayer/shared/services/websocket'
        };
        this.fileCache = new Map();
        this.brokenImports = [];
        this.fixedImports = [];
        this.backup = options.backup !== false;
    }

    /**
     * 모든 파일을 스캔하여 파일 캐시 생성
     */
    buildFileCache() {
        console.log(chalk.blue('📁 Building file cache...'));
        
        const patterns = this.extensions.map(ext => `${this.srcDir}/**/*${ext}`);
        const allFiles = [];
        
        patterns.forEach(pattern => {
            allFiles.push(...glob.sync(pattern));
        });

        allFiles.forEach(filePath => {
            const relativePath = path.relative(process.cwd(), filePath);
            const filename = path.basename(filePath, path.extname(filePath));
            const dirname = path.dirname(relativePath);
            
            // 파일명으로 인덱싱
            if (!this.fileCache.has(filename)) {
                this.fileCache.set(filename, []);
            }
            this.fileCache.get(filename).push({
                fullPath: relativePath,
                dir: dirname,
                isIndex: filename === 'index'
            });
        });

        console.log(chalk.green(`✅ Cached ${allFiles.length} files`));
    }

    /**
     * Import 문에서 파일 경로 추출
     */
    extractImports(content) {
        const imports = [];
        
        // ES6 import 패턴
        const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"`]([^'"`]+)['"`]/g;
        
        // require 패턴
        const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
        
        // dynamic import 패턴
        const dynamicImportRegex = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
        
        let match;
        
        // ES6 imports
        while ((match = importRegex.exec(content)) !== null) {
            imports.push({
                type: 'import',
                path: match[1],
                fullMatch: match[0],
                index: match.index
            });
        }
        
        // require calls
        while ((match = requireRegex.exec(content)) !== null) {
            imports.push({
                type: 'require',
                path: match[1],
                fullMatch: match[0],
                index: match.index
            });
        }
        
        // dynamic imports
        while ((match = dynamicImportRegex.exec(content)) !== null) {
            imports.push({
                type: 'dynamic',
                path: match[1],
                fullMatch: match[0],
                index: match.index
            });
        }
        
        return imports;
    }

    /**
     * 경로 해석 (alias 처리)
     */
    resolvePath(importPath, fromFile) {
        // 절대 경로나 node_modules는 검사하지 않음
        if (importPath.startsWith('http') || 
            !importPath.startsWith('.') && !importPath.startsWith('@') && !importPath.startsWith('src/')) {
            return null;
        }

        // alias 처리
        let resolvedPath = importPath;
        for (const [alias, realPath] of Object.entries(this.aliases)) {
            if (importPath.startsWith(alias + '/')) {
                resolvedPath = importPath.replace(alias, realPath);
                break;
            } else if (importPath === alias) {
                resolvedPath = realPath;
                break;
            }
        }

        // 상대 경로 처리
        if (resolvedPath.startsWith('./') || resolvedPath.startsWith('../')) {
            const fromDir = path.dirname(fromFile);
            resolvedPath = path.resolve(fromDir, resolvedPath);
            resolvedPath = path.relative(process.cwd(), resolvedPath);
        }

        return resolvedPath;
    }

    /**
     * 파일이 존재하는지 확인
     */
    fileExists(filePath) {
        // 확장자가 있는 경우
        if (path.extname(filePath)) {
            return fs.existsSync(filePath);
        }

        // 확장자가 없는 경우 가능한 확장자들 시도
        for (const ext of this.extensions) {
            if (fs.existsSync(filePath + ext)) {
                return true;
            }
        }

        // index 파일 확인
        for (const ext of this.extensions) {
            if (fs.existsSync(path.join(filePath, `index${ext}`))) {
                return true;
            }
        }

        return false;
    }

    /**
     * 올바른 import 경로 찾기
     */
    findCorrectPath(importPath, fromFile) {
        const filename = path.basename(importPath, path.extname(importPath));
        const possibleFiles = this.fileCache.get(filename) || [];
        
        if (possibleFiles.length === 0) {
            return null;
        }

        const fromDir = path.dirname(fromFile);
        
        // 가장 적합한 파일 찾기
        let bestMatch = null;
        let bestScore = -1;

        possibleFiles.forEach(file => {
            let score = 0;
            
            // 경로 유사도 점수 계산
            const relativePath = path.relative(fromDir, file.fullPath);
            const depth = relativePath.split(path.sep).length;
            
            // 깊이가 적을수록 높은 점수
            score += Math.max(0, 10 - depth);
            
            // 원래 경로와 유사할수록 높은 점수
            if (importPath.includes(path.basename(file.dir))) {
                score += 5;
            }
            
            // index 파일이면 가산점
            if (file.isIndex) {
                score += 2;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = file;
            }
        });

        if (bestMatch) {
            // 상대 경로로 변환
            let relativePath = path.relative(fromDir, bestMatch.fullPath);
            if (!relativePath.startsWith('.')) {
                relativePath = './' + relativePath;
            }
            
            // 확장자 제거 (Vue, JS의 경우)
            const ext = path.extname(relativePath);
            if (['.js', '.vue', '.ts'].includes(ext)) {
                relativePath = relativePath.slice(0, -ext.length);
            }
            
            return relativePath.replace(/\\/g, '/'); // Windows 경로 정규화
        }

        return null;
    }

    /**
     * 파일의 import 문제 분석
     */
    analyzeFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const imports = this.extractImports(content);
        const issues = [];

        imports.forEach(imp => {
            const resolvedPath = this.resolvePath(imp.path, filePath);
            if (resolvedPath && !this.fileExists(resolvedPath)) {
                const correctPath = this.findCorrectPath(imp.path, filePath);
                if (correctPath) {
                    issues.push({
                        ...imp,
                        resolvedPath,
                        correctPath,
                        file: filePath
                    });
                }
            }
        });

        return issues;
    }

    /**
     * 백업 생성
     */
    createBackup(filePath) {
        if (!this.backup) return;
        
        const backupDir = '.backup-imports';
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const backupPath = path.join(backupDir, filePath.replace(/[/\\]/g, '_'));
        fs.copyFileSync(filePath, backupPath);
    }

    /**
     * 파일의 import 수정
     */
    fixFileImports(filePath, issues) {
        if (issues.length === 0) return false;

        this.createBackup(filePath);
        
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // 뒤에서부터 수정 (인덱스 변경 방지)
        issues.sort((a, b) => b.index - a.index);

        issues.forEach(issue => {
            const oldImport = issue.fullMatch;
            const newImport = oldImport.replace(issue.path, issue.correctPath);
            
            content = content.slice(0, issue.index) + 
                     newImport + 
                     content.slice(issue.index + oldImport.length);
            
            modified = true;
            
            this.fixedImports.push({
                file: filePath,
                old: issue.path,
                new: issue.correctPath
            });
        });

        if (modified) {
            fs.writeFileSync(filePath, content);
        }

        return modified;
    }

    /**
     * 모든 파일 분석 및 수정
     */
    async fixAllImports() {
        console.log(chalk.blue('🔍 Analyzing import statements...'));
        
        const sourceFiles = glob.sync(`${this.srcDir}/**/*.{js,vue,ts,jsx,tsx}`);
        let totalIssues = 0;
        let fixedFiles = 0;

        for (const filePath of sourceFiles) {
            try {
                const issues = this.analyzeFile(filePath);
                if (issues.length > 0) {
                    console.log(chalk.yellow(`⚠️  ${filePath}: ${issues.length} broken imports`));
                    
                    if (this.fixFileImports(filePath, issues)) {
                        fixedFiles++;
                        console.log(chalk.green(`✅ Fixed ${filePath}`));
                    }
                    
                    totalIssues += issues.length;
                    this.brokenImports.push(...issues);
                }
            } catch (error) {
                console.log(chalk.red(`❌ Error processing ${filePath}: ${error.message}`));
            }
        }

        return { totalIssues, fixedFiles };
    }

    /**
     * 결과 리포트 출력
     */
    printReport(stats) {
        console.log('\n' + chalk.bold.blue('📊 Import Fix Report'));
        console.log(chalk.blue('─'.repeat(50)));
        
        console.log(`${chalk.green('✅ Fixed files:')} ${stats.fixedFiles}`);
        console.log(`${chalk.green('✅ Fixed imports:')} ${this.fixedImports.length}`);
        console.log(`${chalk.yellow('⚠️  Total issues found:')} ${stats.totalIssues}`);
        
        if (this.fixedImports.length > 0) {
            console.log('\n' + chalk.bold.green('🔧 Fixed Imports:'));
            this.fixedImports.forEach(fix => {
                console.log(`  ${chalk.dim(fix.file)}`);
                console.log(`    ${chalk.red(fix.old)} → ${chalk.green(fix.new)}`);
            });
        }

        if (this.backup) {
            console.log('\n' + chalk.blue('💾 Backups created in .backup-imports/'));
            console.log(chalk.dim('Run "node scripts/restore-imports.js" to restore if needed'));
        }
    }

    /**
     * 메인 실행 함수
     */
    async run() {
        console.log(chalk.bold.blue('🚀 Starting Import Fixer\n'));
        
        try {
            this.buildFileCache();
            const stats = await this.fixAllImports();
            this.printReport(stats);
            
            console.log('\n' + chalk.bold.green('🎉 Import fixing completed!'));
            
        } catch (error) {
            console.error(chalk.red('💥 Error:'), error.message);
            process.exit(1);
        }
    }
}

// CLI 실행
if (require.main === module) {
    const fixer = new ImportFixer({
        srcDir: 'src',
        backup: true,
        aliases: {
            '@': 'src',
            '@core': 'src/core',
            '@features': 'src/features',
            '@game': 'src/features/game',
            '@websocket': 'src/features/game/multiplayer/shared/services/websocket'
        }
    });
    
    fixer.run();
}

module.exports = ImportFixer; 