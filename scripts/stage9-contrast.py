"""WCAG ratios from read-only IAB computed styles; no image manipulation."""
import json, re
from pathlib import Path

def rgba(css):
    v = [float(x) for x in re.findall(r'[\d.]+', css)]
    return v[:3] + [v[3] if len(v) > 3 else 1]

def over(front, back):
    return [front[i] * front[3] + back[i] * (1 - front[3]) for i in range(3)]

def luminance(rgb):
    def channel(c):
        c /= 255
        return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4
    return sum(w * channel(c) for w, c in zip([.2126, .7152, .0722], rgb))

results = []
for filename in ['qa/stage9-computed-colors.json', 'qa/stage9-extra-computed-colors.json']:
    for case in json.loads(Path(filename).read_text()):
        ratios, failures = [], []
        for row in case['rows']:
            background = [28, 23, 20]
            for color in reversed(row['backgrounds']):
                background = over(rgba(color), background)
            foreground = over(rgba(row['color']), background)
            a, b = sorted([luminance(foreground), luminance(background)])
            ratio = (b + .05) / (a + .05)
            minimum = 3 if float(row['fontSize'].replace('px', '')) >= 24 else 4.5
            ratios.append(ratio)
            if ratio < minimum:
                failures.append({'text': row['text'], 'ratio': round(ratio, 3), 'minimum': minimum})
        results.append({'scope': case['scope'], 'textRuns': len(ratios), 'minimumRatio': round(min(ratios), 3), 'failures': failures})
Path('qa/stage9-contrast.json').write_text(json.dumps(results, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'textRuns': sum(x['textRuns'] for x in results), 'minimumRatio': min(x['minimumRatio'] for x in results), 'failures': [x for x in results if x['failures']]}, ensure_ascii=False, indent=2))
assert not any(x['failures'] for x in results)
