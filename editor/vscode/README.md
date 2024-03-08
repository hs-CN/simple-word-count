# simple-word-count

一个简单的数字统计插件，默认纯文本文件(.txt)或markdown文件(.md)激活, 可以在配置中添加其他文件后缀。  
This is a simple word count extension for plaintext and markdown files. You can add other file extensions in configuration.

![gif](https://github.com/hs-CN/simple-word-count/raw/master/editor/vscode/a.gif)

# 特性
这个插件会自动被txt、md或者untitled激活。

如果你想为其他文件类型激活插件，可以使用命令手动激活:
+ `Word Count Run (current)`: 为当前文件统计一次。
+ `Word Count Run (all)`: 为所有文件做统计（匹配文件后缀的文件）,会以网页Tab形式展示结果。
+ `Word Count Activate (current)`: 为当前文件激活。
+ `Word Count Activate (always)`: 为所有文件激活。

如果你不想激活untitled，可以在配置中设置`ActivateUntitled`为`false`。

插件默认会统计鼠标选中的内容或者当前行。如果你不想显示选中内容的字数，可以在配置中设置`ShowSelection`为`false`。如果你不想显示当前行的字数，可以在配置中设置`ShowLine`为`false`。

你可以通过配置中的`StatusBarItemPriority`调整插件`StatusBarItem`显示的位置。值越大，显示位置越靠左。


# Features
This extension will activate automatically for plaintext files、markdown files or untitled.

if you want to activate manually for other file types, use command:
+ `Word Count Run (current)`: count for current file once.
+ `Word Count Run (all)`: count for all files (which file extension is matched by configuration item `ActivateFileExtensions`) in workspace.
+ `Word Count Activate (current)`: activate for current file.
+ `Word Count Activate (always)`: activate for all files.

if you don't want to activate for untitled, set configuration item `ActivateUntitled` to `false`.

This extension will count for selection or line defaultly. If you don't want to show selection count, set configuration item `ShowSelection` to `false`. If you don't want to show line count, set configuration item `ShowLine` to `false`.

You can adjust `StatusBarItem` priority by setting configuration item `StatusBarItemPriority`.

# Configuration
| Property | Default | Description |
| --- | --- | --- |
| `ActivateFileExtensions` | `.txt;.md` | 插件激活的文件后缀，用分号分隔。file extensions can be activated, use semicolon to separate multiple file extensions. eg: .txt;.md |
| `ActivateUntitled` | `true` | 是否为未命名文件(untitled)激活。 activate word count for untitled |
| `ShowSelection` | `true` | 显示选中内容的字数。show selection word count |
| `ShowLine` | `true` | 显示当前行的字数。show line word count |
| `SelectionShowDelay` | `300` | 选中或当前行显示的延时(ms) line / selection word count delay (ms) |
| `StatusBarItemPriority` | `100` | 插件状态栏位置调整。StatusBarItem priority. Higher values mean the item should be shown more to the left.|

# Others
目前仅支持win32_x64平台，也许可以支持其他平台。主要问题在于此拓展功能依赖于rust编写的可执行文件，需要到目标平台进行编译。如果有需要，可以提issue。

Only for win32_x64 now. Maybe can support other platforms. The main problem is that this extension depends on rust executable file, which needs to be compiled to the target platform. If you need, you can submit an issue.