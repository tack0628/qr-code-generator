import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import QRCode from 'qrcode';
import './styles.css';

const TYPES = [
  { id: 'url', label: 'URL', icon: '↗' },
  { id: 'text', label: 'テキスト', icon: 'Aa' },
  { id: 'wifi', label: 'Wi-Fi', icon: '⌁' },
];

const INITIAL = {
  type: 'url', url: 'https://example.com', text: '', ssid: '', password: '', encryption: 'WPA', hidden: false,
  size: 512, margin: 4, foreground: '#17352b', background: '#ffffff', level: 'M',
};

const escapeWifi = (value) => value.replace(/([\\;,:"])/g, '\\$1');

function buildPayload(state) {
  if (state.type === 'url') return state.url.trim();
  if (state.type === 'text') return state.text;
  if (!state.ssid.trim()) return '';
  const auth = state.encryption === 'nopass' ? 'nopass' : state.encryption;
  const password = auth === 'nopass' ? '' : `P:${escapeWifi(state.password)};`;
  return `WIFI:T:${auth};S:${escapeWifi(state.ssid)};${password}H:${state.hidden ? 'true' : 'false'};;`;
}

function Field({ label, hint, children }) {
  return <label className="field"><span className="field-label">{label}{hint && <small>{hint}</small>}</span>{children}</label>;
}

function Icon({ name }) {
  const paths = {
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 19h14"/></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function App() {
  const [state, setState] = useState(INITIAL);
  const [svg, setSvg] = useState('');
  const [status, setStatus] = useState('');
  const [generationError, setGenerationError] = useState('');
  const canvasRef = useRef(null);
  const payload = useMemo(() => buildPayload(state), [state]);
  const options = useMemo(() => ({ width: state.size, margin: state.margin, errorCorrectionLevel: state.level, color: { dark: state.foreground, light: state.background } }), [state.size, state.margin, state.level, state.foreground, state.background]);
  const update = (key, value) => setState((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    let cancelled = false;
    if (!payload) { setSvg(''); setGenerationError(''); return; }
    setGenerationError('');
    Promise.all([
      QRCode.toCanvas(canvasRef.current, payload, options),
      QRCode.toString(payload, { ...options, type: 'svg' }),
    ]).then(([, nextSvg]) => { if (!cancelled) setSvg(nextSvg); }).catch(() => {
      if (!cancelled) {
        const context = canvasRef.current?.getContext('2d');
        context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setSvg('');
        setGenerationError('内容が長すぎるか、設定した色が正しくありません。');
      }
    });
    return () => { cancelled = true; };
  }, [payload, options]);

  const announce = (message) => { setStatus(message); window.setTimeout(() => setStatus(''), 2200); };
  const download = (format) => {
    if (!payload || !svg) return;
    const link = document.createElement('a');
    if (format === 'png') link.href = canvasRef.current.toDataURL('image/png');
    else link.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    link.download = `qr-code.${format}`;
    link.click();
    if (format === 'svg') window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    announce(`${format.toUpperCase()}を保存しました`);
  };
  const copyPayload = async () => {
    try { await navigator.clipboard.writeText(payload); announce('内容をコピーしました'); }
    catch { announce('コピーできませんでした'); }
  };

  return <div className="site-shell">
    <header className="topbar">
      <a className="brand" href="./" aria-label="QRつくる トップ"><span className="brand-mark"><i/><i/><i/></span><span>QRつくる</span></a>
      <span className="local-badge"><Icon name="lock"/> ブラウザ内で完結</span>
    </header>

    <main>
      <section className="hero">
        <p className="eyebrow">SIMPLE QR MAKER</p>
        <h1>伝えたい情報を、<br/><em>すぐ読める形</em>に。</h1>
        <p className="lead">URLやテキスト、Wi-Fi情報からQRコードを作成。<br/>入力した内容は外部に送信されません。</p>
      </section>

      <section className="workspace" aria-label="QRコード作成">
        <div className="editor-panel">
          <div className="type-tabs" role="tablist" aria-label="QRコードの種類">
            {TYPES.map((item) => <button key={item.id} role="tab" aria-selected={state.type === item.id} className={state.type === item.id ? 'active' : ''} onClick={() => update('type', item.id)}><b>{item.icon}</b>{item.label}</button>)}
          </div>

          <div className="input-section" role="tabpanel">
            {state.type === 'url' && <Field label="URL"><input type="url" value={state.url} onChange={(e) => update('url', e.target.value)} placeholder="https://example.com" autoComplete="url"/></Field>}
            {state.type === 'text' && <Field label="テキスト" hint={`${state.text.length}文字`}><textarea rows="5" value={state.text} onChange={(e) => update('text', e.target.value)} placeholder="QRコードにしたい文章を入力"/></Field>}
            {state.type === 'wifi' && <div className="wifi-fields">
              <Field label="ネットワーク名（SSID）"><input value={state.ssid} onChange={(e) => update('ssid', e.target.value)} placeholder="例：My Home Wi-Fi" autoComplete="off"/></Field>
              <div className="two-fields">
                <Field label="暗号化方式"><select value={state.encryption} onChange={(e) => update('encryption', e.target.value)}><option value="WPA">WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">暗号化なし</option></select></Field>
                <Field label="パスワード"><input type="password" value={state.password} onChange={(e) => update('password', e.target.value)} placeholder="パスワード" disabled={state.encryption === 'nopass'} autoComplete="new-password"/></Field>
              </div>
              <label className="check-row"><input type="checkbox" checked={state.hidden} onChange={(e) => update('hidden', e.target.checked)}/><span>非公開ネットワーク（SSIDを隠している）</span></label>
            </div>}
          </div>

          <details className="settings" open>
            <summary><span>見た目と読み取りやすさ</span><small>調整</small></summary>
            <div className="settings-grid">
              <Field label="画像サイズ"><select value={state.size} onChange={(e) => update('size', Number(e.target.value))}><option value="256">256 × 256 px</option><option value="512">512 × 512 px</option><option value="1024">1024 × 1024 px</option><option value="2048">2048 × 2048 px</option></select></Field>
              <Field label="エラー訂正"><select value={state.level} onChange={(e) => update('level', e.target.value)}><option value="L">L（約7%）</option><option value="M">M（約15%・標準）</option><option value="Q">Q（約25%）</option><option value="H">H（約30%）</option></select></Field>
              <Field label={`余白：${state.margin}`}><input className="range" type="range" min="0" max="12" value={state.margin} onChange={(e) => update('margin', Number(e.target.value))}/></Field>
              <div className="color-fields">
                <Field label="前景色"><span className="color-control"><input type="color" value={state.foreground} onChange={(e) => update('foreground', e.target.value)}/><input value={state.foreground.toUpperCase()} onChange={(e) => /^#[0-9a-f]{0,6}$/i.test(e.target.value) && update('foreground', e.target.value)} aria-label="前景色コード"/></span></Field>
                <Field label="背景色"><span className="color-control"><input type="color" value={state.background} onChange={(e) => update('background', e.target.value)}/><input value={state.background.toUpperCase()} onChange={(e) => /^#[0-9a-f]{0,6}$/i.test(e.target.value) && update('background', e.target.value)} aria-label="背景色コード"/></span></Field>
              </div>
            </div>
          </details>
        </div>

        <aside className="preview-panel">
          <div className="preview-heading"><div><span>プレビュー</span><small>入力と同時に更新</small></div><i className={svg ? 'ready' : generationError ? 'error' : ''}>{svg ? '生成済み' : generationError ? '生成エラー' : '入力待ち'}</i></div>
          <div className={`qr-stage ${svg ? '' : 'empty'}`} aria-live="polite">
            <canvas ref={canvasRef} aria-label={svg ? '生成されたQRコード' : 'QRコードのプレビュー'} />
            {!payload && <p>内容を入力すると<br/>ここにQRコードが表示されます</p>}
            {generationError && <p className="error-message">{generationError}<br/>内容や色を見直してください。</p>}
          </div>
          <div className="download-grid">
            <button className="download primary" onClick={() => download('png')} disabled={!svg}><Icon name="download"/><span><b>PNGで保存</b><small>画像・SNS向け</small></span></button>
            <button className="download secondary" onClick={() => download('svg')} disabled={!svg}><Icon name="download"/><span><b>SVGで保存</b><small>印刷・デザイン向け</small></span></button>
          </div>
          <div className="payload-row"><span><small>QRコードの内容</small><code>{payload || '—'}</code></span><button onClick={copyPayload} disabled={!payload} aria-label="QRコードの内容をコピー"><Icon name="copy"/></button></div>
          <p className="scan-note">保存前に、お使いのスマートフォンで読み取りを確認してください。</p>
        </aside>
      </section>

      <section className="features" aria-label="このツールの特長">
        <article><span>01</span><h2>外部送信なし</h2><p>すべての処理をお使いのブラウザ内で行います。</p></article>
        <article><span>02</span><h2>登録・インストール不要</h2><p>ページを開いて、すぐ無料で使い始められます。</p></article>
        <article><span>03</span><h2>商用利用OK</h2><p>作成したQRコードは自由にお使いいただけます。</p></article>
      </section>
    </main>

    <footer><a className="brand footer-brand" href="./"><span className="brand-mark"><i/><i/><i/></span><span>QRつくる</span></a><p>日々のちょっとした作業を、少しだけかんたんに。</p><small>© 2026 QRつくる</small></footer>
    <div className="toast" role="status" aria-live="polite" data-show={Boolean(status)}>{status}</div>
  </div>;
}

const rootElement = document.getElementById('root');
const root = globalThis.__qrMakerRoot || createRoot(rootElement);
globalThis.__qrMakerRoot = root;
root.render(<React.StrictMode><App/></React.StrictMode>);
