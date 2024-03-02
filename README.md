# Description
a simple word count function, try to get same result with Microsoft Office Word application.

Not guarantee same result on special characters. Such like Emoji “😘😦😒” is count 1 in Microsoft Office Word, but 3 by word_count.

# Examples
``` rust
use simple_word_count::word_count;

fn main() {
    assert_eq!(word_count("helloworld"), 1);
    assert_eq!(word_count("hello world"), 2);
    assert_eq!(word_count("hello, world"), 2);
    assert_eq!(word_count("h e l l o	w o r l d"), 10);
    assert_eq!(word_count("hi......"), 1);
    assert_eq!(word_count("hello, world | 你好，世界"), 8);
    assert_eq!(word_count("你好世界"), 4);
    assert_eq!(word_count("你好，世界"), 5);
    assert_eq!(word_count("你 好 世 界"), 4);
    assert_eq!(word_count("你好。。。。"), 6);
    assert_eq!(word_count("a=b+c-d"), 1);
    assert_eq!(word_count("a = b + c - d"), 7);
    assert_eq!(word_count("123"), 1);
    assert_eq!(word_count("123.456"), 1);
    assert_eq!(word_count("123..456"), 1);
    assert_eq!(word_count("123.456."), 1);
    assert_eq!(word_count("123 456"), 2);
    assert_eq!(word_count("1+1=2"), 1);
    assert_eq!(word_count("1 + 1 = 2"), 5);
    assert_eq!(word_count("&&%%$$￥￥"), 3);
    assert_eq!(word_count("<>《》"), 3);
}
```