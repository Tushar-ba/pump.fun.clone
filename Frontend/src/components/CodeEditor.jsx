import { useCallback } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-solidity';
import 'prismjs/themes/prism-tomorrow.css';
import './CodeEditor.css';

// Solidity syntax highlighting
const highlightSolidity = (code) => {
  return Prism.highlight(code, Prism.languages.solidity, 'solidity');
};

function CodeEditor({ code, onChange, readOnly = false, title = 'Contract Code' }) {
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
  }, [code]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Token.sol';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [code]);

  return (
    <div className="code-editor-container">
      <div className="code-editor-header">
        <div className="code-editor-title">
          <span className="file-icon">📄</span>
          <span>{title}</span>
        </div>
        <div className="code-editor-actions">
          <button className="code-btn" onClick={handleCopy} title="Copy to clipboard">
            📋 Copy
          </button>
          <button className="code-btn" onClick={handleDownload} title="Download .sol file">
            ⬇️ Download
          </button>
        </div>
      </div>
      <div className="code-editor-wrapper">
        <Editor
          value={code}
          onValueChange={readOnly ? () => {} : onChange}
          highlight={highlightSolidity}
          padding={16}
          className="code-editor"
          style={{
            fontFamily: '"Fira Code", "Fira Mono", Consolas, Monaco, monospace',
            fontSize: 13,
            lineHeight: 1.5,
            minHeight: '400px',
          }}
          readOnly={readOnly}
        />
      </div>
      <div className="code-editor-footer">
        <span className="line-count">{code.split('\n').length} lines</span>
        <span className="language-badge">Solidity</span>
      </div>
    </div>
  );
}

export default CodeEditor;
