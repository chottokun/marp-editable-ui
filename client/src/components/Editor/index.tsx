import { FC } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import './styles.css';

interface EditorProps {
  content: string;
  theme: 'dark' | 'warm';
  onChange: (value: string) => void;
}

const Editor: FC<EditorProps> = ({ content, theme, onChange }) => {
  return (
    <div className="editor">
      <CodeMirror
        value={content}
        height="100%"
        width="100%"
        extensions={[markdown()]}
        onChange={onChange}
        theme={theme === 'warm' ? 'light' : 'dark'}
        className={`editor-${theme}`}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
        style={{
          height: '100%',
          maxHeight: '100%',
          overflow: 'auto'
        }}
        indentWithTab={true}
        placeholder="マークダウンを入力してください..."
      />
    </div>
  );
};

export default Editor;
