use simple_word_count::word_count;
use std::fs::read_to_string;
use std::io::{BufRead, BufReader, Read, Write};
use std::net::{Ipv4Addr, TcpListener};
use std::sync::Arc;
use std::thread::spawn;

/// Protocol: type;content_type;id;content_length\ncontent\n
fn main() -> std::io::Result<()> {
    let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, 0))?;
    println!("{}", listener.local_addr().unwrap().port());

    let (stream, _) = listener.accept()?;
    let stream = Arc::new(stream);
    let reader = stream.clone();
    let mut buf_reader = BufReader::new(reader.as_ref());
    let mut cmd = String::new();
    loop {
        cmd.clear();
        buf_reader.read_line(&mut cmd)?;
        let cmd_vec: Vec<&str> = cmd[..cmd.len() - 1].split(';').collect();
        if cmd_vec.len() < 4 {
            break;
        }

        match cmd_vec[..4] {
            ["txt", "str", id, len] => {
                if let Ok(len) = len.parse() {
                    let mut buf = vec![0; len];
                    buf_reader.read_exact(&mut buf)?;
                    let id = id.to_owned();
                    let sender = stream.clone();
                    spawn(move || {
                        let mut count = 0;
                        if let Ok(str) = String::from_utf8(buf) {
                            count = word_count(&str) as u32;
                        }
                        sender
                            .as_ref()
                            .write_all(format!("{};{}\n", id, count).as_bytes())
                            .unwrap();
                        sender.as_ref().flush().unwrap();
                    });
                }
            }
            ["txt", "file", id, len] => {
                if let Ok(len) = len.parse() {
                    let mut buf = vec![0; len];
                    buf_reader.read_exact(&mut buf)?;
                    let id = id.to_owned();
                    let sender = stream.clone();
                    spawn(move || {
                        let mut count = 0;
                        if let Ok(path) = String::from_utf8(buf) {
                            count = read_to_string(path)
                                .map(|str| word_count(&str))
                                .unwrap_or(0) as u32;
                        }
                        sender
                            .as_ref()
                            .write_all(format!("{};{}\n", id, count).as_bytes())
                            .unwrap();
                        sender.as_ref().flush().unwrap();
                    });
                }
            }
            _ => break,
        }
    }
    Ok(())
}
