<template>
  <div class="markdown-content" v-html="renderedMarkdown"></div>
</template>

<script setup>
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  breaks: {
    type: Boolean,
    default: true
  },
  html: {
    type: Boolean,
    default: false
  }
})

// 配置markdown-it
const md = new MarkdownIt({
  html: props.html,        // 是否允许HTML标签
  breaks: props.breaks,    // 是否换行符转换为<br>
  linkify: true,           // 自动识别链接
  typographer: true        // 启用更智能的排版
})

const renderedMarkdown = computed(() => {
  if (!props.content) return ''
  return md.render(props.content)
})
</script>

<style scoped>
/* Markdown渲染后的样式 */
.markdown-content {
  line-height: 1.6;
  color: inherit;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 标题样式 */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin: 16px 0 8px 0;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-color);
}

.markdown-content :deep(h1) {
  font-size: 1.5em;
  border-bottom: 1px solid var(--border-color-light);
  padding-bottom: 8px;
}

.markdown-content :deep(h2) {
  font-size: 1.3em;
}

.markdown-content :deep(h3) {
  font-size: 1.2em;
}

.markdown-content :deep(h4) {
  font-size: 1.1em;
}

/* 段落样式 */
.markdown-content :deep(p) {
  margin: 8px 0;
  line-height: 1.6;
}

/* 列表样式 */
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.markdown-content :deep(li) {
  margin: 4px 0;
  line-height: 1.5;
}

/* 代码样式 */
.markdown-content :deep(code) {
  background-color: var(--background-color-light, #f5f7fa);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
  color: var(--text-color);
  border: 1px solid var(--border-color-light, #e4e7ed);
}

.markdown-content :deep(pre) {
  background-color: var(--background-color-light, #f5f7fa);
  padding: 12px 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
  border: 1px solid var(--border-color-light, #e4e7ed);
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
  border: none;
  color: inherit;
}

/* 引用样式 */
.markdown-content :deep(blockquote) {
  margin: 12px 0;
  padding: 12px 16px;
  border-left: 4px solid var(--primary-color);
  background-color: var(--accent-color, rgba(64, 158, 255, 0.1));
  border-radius: 0 8px 8px 0;
}

.markdown-content :deep(blockquote p) {
  margin: 0;
  font-style: italic;
  color: var(--text-color-secondary);
}

/* 链接样式 */
.markdown-content :deep(a) {
  color: var(--primary-color);
  text-decoration: none;
  transition: color 0.3s ease;
}

.markdown-content :deep(a:hover) {
  color: var(--secondary-color);
  text-decoration: underline;
}

/* 表格样式 */
.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  overflow: hidden;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-color-light);
}

.markdown-content :deep(th) {
  background-color: var(--background-color-light);
  font-weight: 600;
  color: var(--text-color);
}

.markdown-content :deep(tr:last-child td) {
  border-bottom: none;
}

/* 水平线样式 */
.markdown-content :deep(hr) {
  border: none;
  height: 1px;
  background-color: var(--border-color-light);
  margin: 20px 0;
}

/* 强调样式 */
.markdown-content :deep(strong) {
  font-weight: 600;
  color: var(--text-color);
}

.markdown-content :deep(em) {
  font-style: italic;
  color: var(--text-color-secondary);
}

/* 删除线样式 */
.markdown-content :deep(del) {
  text-decoration: line-through;
  color: var(--text-color-secondary);
}

/* 深色模式适配 */
.dark-mode .markdown-content :deep(code),
.dark-mode .markdown-content :deep(pre) {
  background-color: var(--background-color-dark-hover, #2d3748);
  border-color: var(--border-color-dark, #4b5563);
  color: var(--text-color-dark, rgba(255, 255, 255, 0.9));
}

.dark-mode .markdown-content :deep(blockquote) {
  background-color: rgba(var(--primary-color-rgb), 0.1);
  border-left-color: var(--primary-color);
}

.dark-mode .markdown-content :deep(blockquote p) {
  color: var(--text-color-secondary-dark, rgba(255, 255, 255, 0.7));
}

.dark-mode .markdown-content :deep(table) {
  border-color: var(--border-color-dark);
}

.dark-mode .markdown-content :deep(th),
.dark-mode .markdown-content :deep(td) {
  border-bottom-color: var(--border-color-dark);
}

.dark-mode .markdown-content :deep(th) {
  background-color: var(--background-color-dark-hover);
  color: var(--text-color-dark);
}

.dark-mode .markdown-content :deep(hr) {
  background-color: var(--border-color-dark);
}
</style>
