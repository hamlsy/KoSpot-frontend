const fs = require('fs');
const path = require('path');

// 디렉토리 내의 모든 파일을 재귀적으로 탐색하는 함수
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

// Vue 파일에서 beforeDestroy를 beforeUnmount로 변경하는 함수
function updateLifecycleHooks(filePath) {
  if (!filePath.endsWith('.vue')) return;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // beforeDestroy를 beforeUnmount로 변경
    let updatedContent = content.replace(/beforeDestroy\(\)/g, 'beforeUnmount()');
    
    // 변경된 내용이 있으면 파일 저장
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

// src 디렉토리 내의 모든 Vue 파일 처리
walkDir(path.join(__dirname, 'src'), updateLifecycleHooks);

console.log('Lifecycle hooks update completed!');
