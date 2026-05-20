import sys

with open('C:\\tmp\\qr_b64.txt', 'r') as f:
    lines = f.read().strip().split('\n')
    wechat = lines[0].split('=', 1)[1]
    alipay = lines[1].split('=', 1)[1]

with open('C:\\Users\\26777\\projects\\ai-writer\\worker\\static.js', 'r', encoding='utf-8') as f:
    content = f.read()

old = '''          <div class="qr-placeholder">
            <img src="https://via.placeholder.com/200x200?text=WeChat+Pay+QR" alt="微信收款码">
          </div>
          <p style="font-size:13px;color:var(--gray-400)">微信扫码支付，即时到账</p>'''

new = '''          <div style="display:flex;gap:12px;justify-content:center;margin:16px 0">
            <div>
              <img src="data:image/jpeg;base64,''' + wechat + '''" alt="微信收款码" style="width:140px;height:140px;border-radius:8px">
              <p style="font-size:12px;color:var(--gray-400);margin-top:4px">微信支付</p>
            </div>
            <div>
              <img src="data:image/jpeg;base64,''' + alipay + '''" alt="支付宝收款码" style="width:140px;height:140px;border-radius:8px">
              <p style="font-size:12px;color:var(--gray-400);margin-top:4px">支付宝</p>
            </div>
          </div>
          <p style="font-size:13px;color:var(--gray-400)">扫码支付，即时到账</p>'''

content = content.replace(old, new)

with open('C:\\Users\\26777\\projects\\ai-writer\\worker\\static.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('QR codes updated successfully')
print(f'WeChat: {len(wechat)} chars')
print(f'Alipay: {len(alipay)} chars')
