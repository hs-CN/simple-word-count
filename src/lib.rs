//! a simple word count function, try to get same result with **Microsoft Office Word** application.
//!
//! Not guarantee same result on special characters. Such like Emoji "😘😦😒" is count `1` in **Microsoft Office Word**, but `3` by [word_count].
//!
//! # Examples
//!
//! ``` rust
//! use simple_word_count::word_count;
//!
//! assert_eq!(word_count("helloworld"), 1);
//! assert_eq!(word_count("hello world"), 2);
//! assert_eq!(word_count("hello, world"), 2);
//! assert_eq!(word_count("h e l l o    w o r l d"), 10);
//! assert_eq!(word_count("hi......"), 1);
//! assert_eq!(word_count("hello, world | 你好，世界"), 8);
//! assert_eq!(word_count("你好世界"), 4);
//! assert_eq!(word_count("你好，世界"), 5);
//! assert_eq!(word_count("你 好 世 界"), 4);
//! assert_eq!(word_count("你好。。。。"), 6);
//! assert_eq!(word_count("a=b+c-d"), 1);
//! assert_eq!(word_count("a = b + c - d"), 7);
//! assert_eq!(word_count("123"), 1);
//! assert_eq!(word_count("123.456"), 1);
//! assert_eq!(word_count("123..456"), 1);
//! assert_eq!(word_count("123.456."), 1);
//! assert_eq!(word_count("123 456"), 2);
//! assert_eq!(word_count("1+1=2"), 1);
//! assert_eq!(word_count("1 + 1 = 2"), 5);
//! assert_eq!(word_count("&&%%$$￥￥"), 3);
//! assert_eq!(word_count("<>《》"), 3);
//! ```

/// Count the number of words in the given text.
///
/// # Examples
///
/// ``` rust
/// use simple_word_count::word_count;
///
/// assert_eq!(word_count("helloworld"), 1);
/// assert_eq!(word_count("hello world"), 2);
/// assert_eq!(word_count("hello, world"), 2);
/// assert_eq!(word_count("h e l l o    w o r l d"), 10);
/// assert_eq!(word_count("hi......"), 1);
/// assert_eq!(word_count("hello, world | 你好，世界"), 8);
/// assert_eq!(word_count("你好世界"), 4);
/// assert_eq!(word_count("你好，世界"), 5);
/// assert_eq!(word_count("你 好 世 界"), 4);
/// assert_eq!(word_count("你好。。。。"), 6);
/// assert_eq!(word_count("a=b+c-d"), 1);
/// assert_eq!(word_count("a = b + c - d"), 7);
/// assert_eq!(word_count("123"), 1);
/// assert_eq!(word_count("123.456"), 1);
/// assert_eq!(word_count("123..456"), 1);
/// assert_eq!(word_count("123.456."), 1);
/// assert_eq!(word_count("123 456"), 2);
/// assert_eq!(word_count("1+1=2"), 1);
/// assert_eq!(word_count("1 + 1 = 2"), 5);
/// assert_eq!(word_count("(╯°□°）╯︵ ┻━┻"), 11);
/// assert_eq!(word_count("(●'◡'●)"), 7);
/// assert_eq!(word_count("( ´･･)ﾉ(._.`)"), 7);
/// assert_eq!(word_count("&&%%$$￥￥"), 3);
/// assert_eq!(word_count("EXH.C-◇"), 2);
/// assert_eq!(word_count("<>《》"), 3);
/// ```

pub fn word_count(text: &str) -> usize {
    let mut in_word = false;
    let mut count = 0;
    for char in text.chars() {
        if char.is_whitespace() {
            in_word = false;
        } else if char.is_ascii() {
            if !in_word {
                count += 1;
                in_word = true;
            }
        } else {
            in_word = false;
            count += 1;
        }
    }
    count
}

#[cfg(test)]
mod tests {
    use super::word_count;

    #[test]
    fn number() {
        assert_eq!(word_count("123"), 1);
        assert_eq!(word_count("123.456"), 1);
        assert_eq!(word_count("123..456"), 1);
        assert_eq!(word_count("123.456."), 1);
        assert_eq!(word_count("123 456"), 2);
        assert_eq!(word_count("1+1=2"), 1);
        assert_eq!(word_count("1 + 1 = 2"), 5);
    }

    #[test]
    fn english() {
        assert_eq!(word_count("helloworld"), 1);
        assert_eq!(word_count("hello world"), 2);
        assert_eq!(word_count("hello, world"), 2);
        assert_eq!(word_count("hello, world."), 2);
        assert_eq!(word_count("h e l l o	w o r l d"), 10);
        assert_eq!(word_count("a = b + c - d"), 7);
        assert_eq!(word_count("a=b+c-d"), 1);
        assert_eq!(word_count("hi......"), 1);
        assert_eq!(word_count("......"), 1);
    }

    #[test]
    fn chinese() {
        assert_eq!(word_count("你好世界"), 4);
        assert_eq!(word_count("你好，世界"), 5);
        assert_eq!(word_count("你 好 世 界"), 4);
        assert_eq!(word_count("。。。。"), 4);
    }

    #[test]
    fn punctuation() {
        assert_eq!(word_count(":::"), 1);
        assert_eq!(word_count("：：："), 3);
        assert_eq!(word_count("'''"), 1);
        assert_eq!(word_count("‘’‘"), 3);
        assert_eq!(word_count(";;;"), 1);
        assert_eq!(word_count("；；；"), 3);
        assert_eq!(word_count("()（）"), 3);
        assert_eq!(word_count("<>《》"), 3);
    }

    #[test]
    fn others() {
        assert_eq!(word_count("hello, world | 你好，世界"), 8);
        assert_eq!(word_count("(╯°□°）╯︵ ┻━┻"), 11);
        assert_eq!(word_count("(●'◡'●)"), 7);
        assert_eq!(word_count("( ´･･)ﾉ(._.`)"), 7);
        assert_eq!(word_count("&&%%$$￥￥"), 3);
        assert_eq!(word_count("EXH.C-◇"), 2);
    }
}
