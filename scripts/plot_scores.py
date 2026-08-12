import matplotlib.pyplot as plt
import numpy as np

classes = ['IS-1', 'IS-2', 'IS-3', 'Total']
n_classes = len(classes)

data = {
    'Pre Test': {
        'avg': [9.28, 8.76, 9.38, 9.17],
        'min': [5.6, 3.5, 6.9, 3.5],
        'max': [10, 10.0, 10, 10],
    },
    'Post Test 1': {
        'avg': [9.94, 9.82, 9.63, 9.77],
        'min': [9.5, 9.0, 0.5, 0.5],
        'max': [10, 10, 10, 10],
    },
    'Post Test 2': {
        'avg': [9.92, 8.74, 9.12, 9.21],
        'min': [8.7, 7.0, 0.0, 0.0],
        'max': [10, 9.7, 10, 10],
    },
}

colors = ['#4C72B0', '#DD8452', '#55A868']
labels = list(data.keys())

x = np.arange(n_classes)
bar_w = 0.22

fig, ax = plt.subplots(figsize=(8, 4.5))

for i, (label, d) in enumerate(data.items()):
    offset = (i - 1) * bar_w
    bars = ax.bar(
        x + offset, d['avg'], bar_w,
        label=label, color=colors[i], edgecolor='white', linewidth=0.5,
        zorder=3
    )
    for j in range(n_classes):
        ax.text(
            x[j] + offset, d['avg'][j] + 0.25,
            f'{d["avg"][j]:.2f}',
            ha='center', va='bottom', fontsize=7, fontweight='bold',
            color='#333333'
        )

ax.set_xlabel('Class', fontsize=11, labelpad=8)
ax.set_ylabel('Score', fontsize=11, labelpad=8)
ax.set_xticks(x)
ax.set_xticklabels(classes, fontsize=11)
ax.set_ylim(0, 11)
ax.set_yticks(np.arange(0, 11, 1))
ax.legend(loc='lower left', fontsize=9, framealpha=0.9, edgecolor='#CCCCCC')
ax.grid(axis='y', alpha=0.3, zorder=0)
ax.set_axisbelow(True)

plt.tight_layout()
plt.savefig('assets/scores.png', dpi=200, bbox_inches='tight')
print('Saved assets/scores.png')
