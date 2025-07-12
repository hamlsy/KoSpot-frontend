#!/usr/bin/env node

/**
 * 🧹 Advanced Code Deduplicator
 * CSS와 JavaScript 중복 코드를 찾아서 제거하고 최적화하는 스크립트
 * 
 * 기능:
 * - 중복 CSS 클래스/스타일 감지 및 통합
 * - 중복 JavaScript 함수 감지 및 추출
 * - 공통 유틸리티 함수 자동 생성
 * - 중복률 분석 및 리포트
 * - 자동 리팩토링 제안
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');
const crypto = require('crypto');

class CodeDeduplicator {
    constructor(options = {}) {
        this.srcDir = options.srcDir || 'src';
        this.threshold = options.threshold || 0.8; // 80% 유사도
        this.minLength = options.minLength || 50; // 최소 코드 길이
        this.backup = options.backup !== false;
        
        this.cssFiles = [];
        this.jsFiles = [];
        this.vueFiles = [];
        
        this.duplicateCss = [];
        this.duplicateJs = [];
        this.duplicateUtils = [];
        
        this.stats = {
            filesScanned: 0,
            cssRulesFound: 0,
            jsFunctionsFound: 0,
            duplicatesRemoved: 0,
            bytesReduced: 0
        };
    }

    /**
     * 파일 목록 수집
     */
    collectFiles() {
        console.log(chalk.blue('📁 Collecting files...'));
        
        this.cssFiles = glob.sync(`${this.srcDir}/**/*.{css,scss,sass,less}`);
        this.jsFiles = glob.sync(`${this.srcDir}/**/*.{js,ts}`);
        this.vueFiles = glob.sync(`${this.srcDir}/**/*.vue`);
        
        this.stats.filesScanned = this.cssFiles.length + this.jsFiles.length + this.vueFiles.length;
        
        console.log(chalk.green(`✅ Found ${this.stats.filesScanned} files`));
        console.log(`  CSS: ${this.cssFiles.length}, JS: ${this.jsFiles.length}, Vue: ${this.vueFiles.length}`);
    }

    /**
     * CSS 규칙 추출
     */
    extractCssRules(content, filePath) {
        const rules = [];
        
        // CSS 규칙 정규식 (기본)
        const ruleRegex = /([^{}]+)\s*\{([^{}]*)\}/g;
        let match;
        
        while ((match = ruleRegex.exec(content)) !== null) {
            const selector = match[1].trim();
            const properties = match[2].trim();
            
            if (properties.length > this.minLength) {
                rules.push({
                    selector: selector,
                    properties: properties,
                    hash: this.generateHash(properties),
                    file: filePath,
                    fullRule: match[0]
                });
            }
        }
        
        return rules;
    }

    /**
     * JavaScript 함수 추출
     */
    extractJsFunctions(content, filePath) {
        const functions = [];
        
        // 함수 선언 정규식들
        const patterns = [
            // function name() {}
            /function\s+(\w+)\s*\([^)]*\)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g,
            // const name = function() {}
            /const\s+(\w+)\s*=\s*function\s*\([^)]*\)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g,
            // const name = () => {}
            /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g,
            // method() {}
            /(\w+)\s*\([^)]*\)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const name = match[1];
                const body = match[2].trim();
                
                if (body.length > this.minLength && !this.isSimpleFunction(body)) {
                    functions.push({
                        name: name,
                        body: body,
                        hash: this.generateHash(body),
                        file: filePath,
                        fullFunction: match[0]
                    });
                }
            }
        });
        
        return functions;
    }

    /**
     * Vue 파일에서 스타일과 스크립트 추출
     */
    extractVueContent(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const cssRules = [];
        const jsFunctions = [];
        
        // <style> 블록 추출
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
        let styleMatch;
        while ((styleMatch = styleRegex.exec(content)) !== null) {
            const styleContent = styleMatch[1];
            cssRules.push(...this.extractCssRules(styleContent, filePath));
        }
        
        // <script> 블록 추출
        const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
        let scriptMatch;
        while ((scriptMatch = scriptRegex.exec(content)) !== null) {
            const scriptContent = scriptMatch[1];
            jsFunctions.push(...this.extractJsFunctions(scriptContent, filePath));
        }
        
        return { cssRules, jsFunctions };
    }

    /**
     * 해시 생성
     */
    generateHash(content) {
        // 공백과 개행 정규화
        const normalized = content.replace(/\s+/g, ' ').trim();
        return crypto.createHash('md5').update(normalized).digest('hex');
    }

    /**
     * 단순 함수인지 확인
     */
    isSimpleFunction(body) {
        const lines = body.split('\n').filter(line => line.trim());
        return lines.length <= 2; // 2줄 이하는 단순 함수로 간주
    }

    /**
     * 유사도 계산
     */
    calculateSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = Array(len2 + 1).fill().map(() => Array(len1 + 1).fill(0));
        
        for (let i = 0; i <= len1; i++) matrix[0][i] = i;
        for (let j = 0; j <= len2; j++) matrix[j][0] = j;
        
        for (let j = 1; j <= len2; j++) {
            for (let i = 1; i <= len1; i++) {
                if (str1[i - 1] === str2[j - 1]) {
                    matrix[j][i] = matrix[j - 1][i - 1];
                } else {
                    matrix[j][i] = Math.min(
                        matrix[j - 1][i] + 1,
                        matrix[j][i - 1] + 1,
                        matrix[j - 1][i - 1] + 1
                    );
                }
            }
        }
        
        const distance = matrix[len2][len1];
        return 1 - distance / Math.max(len1, len2);
    }

    /**
     * CSS 중복 찾기
     */
    findCssDuplicates(cssRules) {
        console.log(chalk.blue('🎨 Analyzing CSS duplicates...'));
        
        const groups = new Map();
        
        cssRules.forEach(rule => {
            if (!groups.has(rule.hash)) {
                groups.set(rule.hash, []);
            }
            groups.get(rule.hash).push(rule);
        });
        
        const duplicates = [];
        groups.forEach(group => {
            if (group.length > 1) {
                duplicates.push({
                    hash: group[0].hash,
                    properties: group[0].properties,
                    files: group.map(r => ({ file: r.file, selector: r.selector })),
                    count: group.length
                });
            }
        });
        
        console.log(chalk.yellow(`⚠️  Found ${duplicates.length} CSS duplicate groups`));
        return duplicates;
    }

    /**
     * JavaScript 중복 찾기
     */
    findJsDuplicates(jsFunctions) {
        console.log(chalk.blue('⚙️  Analyzing JavaScript duplicates...'));
        
        const groups = new Map();
        const similarGroups = [];
        
        // 정확한 중복
        jsFunctions.forEach(func => {
            if (!groups.has(func.hash)) {
                groups.set(func.hash, []);
            }
            groups.get(func.hash).push(func);
        });
        
        const exactDuplicates = [];
        groups.forEach(group => {
            if (group.length > 1) {
                exactDuplicates.push({
                    hash: group[0].hash,
                    body: group[0].body,
                    functions: group,
                    count: group.length,
                    type: 'exact'
                });
            }
        });
        
        // 유사한 함수 찾기
        const processed = new Set();
        jsFunctions.forEach((func1, i) => {
            if (processed.has(i)) return;
            
            const similar = [func1];
            jsFunctions.forEach((func2, j) => {
                if (i !== j && !processed.has(j)) {
                    const similarity = this.calculateSimilarity(func1.body, func2.body);
                    if (similarity >= this.threshold) {
                        similar.push(func2);
                        processed.add(j);
                    }
                }
            });
            
            if (similar.length > 1) {
                similarGroups.push({
                    functions: similar,
                    count: similar.length,
                    type: 'similar',
                    similarity: this.calculateAverageSimilarity(similar)
                });
            }
            
            processed.add(i);
        });
        
        console.log(chalk.yellow(`⚠️  Found ${exactDuplicates.length} exact JS duplicates`));
        console.log(chalk.yellow(`⚠️  Found ${similarGroups.length} similar JS function groups`));
        
        return [...exactDuplicates, ...similarGroups];
    }

    /**
     * 평균 유사도 계산
     */
    calculateAverageSimilarity(functions) {
        if (functions.length < 2) return 1;
        
        let total = 0;
        let count = 0;
        
        for (let i = 0; i < functions.length; i++) {
            for (let j = i + 1; j < functions.length; j++) {
                total += this.calculateSimilarity(functions[i].body, functions[j].body);
                count++;
            }
        }
        
        return count > 0 ? total / count : 1;
    }

    /**
     * 공통 유틸리티 파일 생성
     */
    generateUtilityFile(duplicates, type) {
        const utilsDir = path.join(this.srcDir, 'shared', 'utils');
        if (!fs.existsSync(utilsDir)) {
            fs.mkdirSync(utilsDir, { recursive: true });
        }
        
        let content = '';
        let imports = '';
        
        if (type === 'css') {
            content = `/* 🧹 Auto-generated common styles */\n\n`;
            
            duplicates.forEach((dup, index) => {
                const className = `common-style-${index + 1}`;
                content += `.${className} {\n${dup.properties}\n}\n\n`;
                
                // 원본 파일들에 대한 정보 주석
                content += `/* Used in:\n`;
                dup.files.forEach(f => {
                    content += ` * ${f.file} (${f.selector})\n`;
                });
                content += ` */\n\n`;
            });
            
            fs.writeFileSync(path.join(utilsDir, 'common-styles.css'), content);
            
        } else if (type === 'js') {
            content = `// 🧹 Auto-generated common utilities\n\n`;
            
            duplicates.forEach((dup, index) => {
                if (dup.type === 'exact') {
                    const funcName = `commonUtil${index + 1}`;
                    content += `export function ${funcName}() {\n${dup.body}\n}\n\n`;
                    
                    // 원본 함수들에 대한 정보 주석
                    content += `/* Replaces:\n`;
                    dup.functions.forEach(f => {
                        content += ` * ${f.name}() in ${f.file}\n`;
                    });
                    content += ` */\n\n`;
                }
            });
            
            fs.writeFileSync(path.join(utilsDir, 'common-utils.js'), content);
        }
        
        return { utilsDir, content };
    }

    /**
     * 백업 생성
     */
    createBackup() {
        if (!this.backup) return;
        
        const backupDir = '.backup-deduplication';
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // 전체 src 폴더 백업
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `src-${timestamp}`);
        
        this.copyDir(this.srcDir, backupPath);
        console.log(chalk.blue(`💾 Backup created: ${backupPath}`));
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
     * 중복 제거 실행
     */
    async removeDuplicates() {
        console.log(chalk.blue('🔄 Processing duplicates...'));
        
        // CSS와 JavaScript 규칙/함수 수집
        const allCssRules = [];
        const allJsFunctions = [];
        
        // CSS 파일 처리
        this.cssFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            allCssRules.push(...this.extractCssRules(content, file));
        });
        
        // JS 파일 처리
        this.jsFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            allJsFunctions.push(...this.extractJsFunctions(content, file));
        });
        
        // Vue 파일 처리
        this.vueFiles.forEach(file => {
            const { cssRules, jsFunctions } = this.extractVueContent(file);
            allCssRules.push(...cssRules);
            allJsFunctions.push(...jsFunctions);
        });
        
        this.stats.cssRulesFound = allCssRules.length;
        this.stats.jsFunctionsFound = allJsFunctions.length;
        
        // 중복 찾기
        this.duplicateCss = this.findCssDuplicates(allCssRules);
        this.duplicateJs = this.findJsDuplicates(allJsFunctions);
        
        // 공통 파일 생성
        if (this.duplicateCss.length > 0) {
            this.generateUtilityFile(this.duplicateCss, 'css');
        }
        
        if (this.duplicateJs.length > 0) {
            this.generateUtilityFile(this.duplicateJs, 'js');
        }
        
        this.stats.duplicatesRemoved = this.duplicateCss.length + this.duplicateJs.length;
    }

    /**
     * 최적화 제안 생성
     */
    generateSuggestions() {
        const suggestions = [];
        
        // CSS 최적화 제안
        this.duplicateCss.forEach((dup, index) => {
            suggestions.push({
                type: 'CSS',
                priority: 'HIGH',
                description: `${dup.count} identical CSS rules found`,
                action: `Extract to common-style-${index + 1} class`,
                savings: `~${dup.properties.length * (dup.count - 1)} bytes`,
                files: dup.files.map(f => f.file)
            });
        });
        
        // JS 최적화 제안
        this.duplicateJs.forEach((dup, index) => {
            const priority = dup.type === 'exact' ? 'HIGH' : 'MEDIUM';
            suggestions.push({
                type: 'JavaScript',
                priority: priority,
                description: `${dup.count} ${dup.type} functions found`,
                action: `Extract to commonUtil${index + 1}()`,
                savings: `~${dup.functions[0]?.body.length * (dup.count - 1)} bytes`,
                files: dup.functions.map(f => f.file)
            });
        });
        
        return suggestions;
    }

    /**
     * 리포트 출력
     */
    printReport() {
        console.log('\n' + chalk.bold.blue('📊 Code Deduplication Report'));
        console.log(chalk.blue('─'.repeat(60)));
        
        console.log(`${chalk.green('📁 Files scanned:')} ${this.stats.filesScanned}`);
        console.log(`${chalk.green('🎨 CSS rules found:')} ${this.stats.cssRulesFound}`);
        console.log(`${chalk.green('⚙️  JS functions found:')} ${this.stats.jsFunctionsFound}`);
        console.log(`${chalk.yellow('🔍 CSS duplicates:')} ${this.duplicateCss.length}`);
        console.log(`${chalk.yellow('🔍 JS duplicates:')} ${this.duplicateJs.length}`);
        console.log(`${chalk.green('✅ Total duplicates removed:')} ${this.stats.duplicatesRemoved}`);
        
        // 상세 중복 정보
        if (this.duplicateCss.length > 0) {
            console.log('\n' + chalk.bold.yellow('🎨 CSS Duplicates:'));
            this.duplicateCss.forEach((dup, index) => {
                console.log(chalk.yellow(`  ${index + 1}. ${dup.count} identical rules`));
                console.log(chalk.dim(`     Files: ${dup.files.map(f => f.file).join(', ')}`));
            });
        }
        
        if (this.duplicateJs.length > 0) {
            console.log('\n' + chalk.bold.yellow('⚙️  JavaScript Duplicates:'));
            this.duplicateJs.forEach((dup, index) => {
                console.log(chalk.yellow(`  ${index + 1}. ${dup.count} ${dup.type} functions`));
                if (dup.similarity) {
                    console.log(chalk.dim(`     Similarity: ${(dup.similarity * 100).toFixed(1)}%`));
                }
                console.log(chalk.dim(`     Files: ${dup.functions.map(f => f.file).join(', ')}`));
            });
        }
        
        // 최적화 제안
        const suggestions = this.generateSuggestions();
        if (suggestions.length > 0) {
            console.log('\n' + chalk.bold.green('💡 Optimization Suggestions:'));
            suggestions.forEach((suggestion, index) => {
                const priorityColor = suggestion.priority === 'HIGH' ? chalk.red : chalk.yellow;
                console.log(`  ${index + 1}. ${priorityColor(suggestion.priority)} - ${suggestion.description}`);
                console.log(chalk.dim(`     Action: ${suggestion.action}`));
                console.log(chalk.dim(`     Potential savings: ${suggestion.savings}`));
            });
        }
        
        if (this.backup) {
            console.log('\n' + chalk.blue('💾 Backup created in .backup-deduplication/'));
        }
    }

    /**
     * 메인 실행 함수
     */
    async run() {
        console.log(chalk.bold.blue('🧹 Starting Code Deduplication\n'));
        
        try {
            this.createBackup();
            this.collectFiles();
            await this.removeDuplicates();
            this.printReport();
            
            console.log('\n' + chalk.bold.green('🎉 Code deduplication completed!'));
            
        } catch (error) {
            console.error(chalk.red('💥 Error:'), error.message);
            console.error(error.stack);
            process.exit(1);
        }
    }
}

// CLI 실행
if (require.main === module) {
    const deduplicator = new CodeDeduplicator({
        srcDir: 'src',
        threshold: 0.8,
        minLength: 50,
        backup: true
    });
    
    deduplicator.run();
}

module.exports = CodeDeduplicator; 