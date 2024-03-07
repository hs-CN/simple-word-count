export interface FileType {
    name: string;
    path: string;
}

export interface FolderType {
    name: string;
    folders: FolderType[];
    files: FileType[];
}

export interface MessageType {
    trees: FolderType[];
    list: { [key: string]: number };
}

export function generateDebugMessage(): MessageType {
    return {
        trees: [
            {
                name: "aaa",
                folders: [
                    {
                        name: "bbb",
                        folders: [
                            {
                                name: "ccc",
                                folders: [],
                                files: [
                                    {
                                        name: "ddd",
                                        path: "aaa/bbb/ccc/ddd",
                                    },
                                    {
                                        name: "eee",
                                        path: "aaa/bbb/ccc/eee",
                                    },
                                ],
                            },
                        ],
                        files: [
                            {
                                name: "ddd",
                                path: "aaa/bbb/ddd",
                            },
                            {
                                name: "eee",
                                path: "aaa/bbb/eee",
                            },
                        ],
                    },
                    {
                        name: "ddd",
                        folders: [],
                        files: [
                            {
                                name: "eee",
                                path: "aaa/bbb/ddd/eee",
                            },
                            {
                                name: "fff",
                                path: "aaa/bbb/ddd/fff",
                            },
                        ],
                    },
                ],
                files: [
                    {
                        name: "eee",
                        path: "aaa/eee",
                    },
                    {
                        name: "fff",
                        path: "aaa/fff",
                    },
                ],
            },
        ],
        list: {
            "aaa/eee": 1,
            "aaa/fff": 1,
            "aaa/bbb/ccc/ddd": 1,
            "aaa/bbb/ccc/eee": 1,
            "aaa/bbb/ddd/eee": 1,
            "aaa/bbb/ddd/fff": 1,
            "aaa/bbb/eee": 1,
            "aaa/bbb/ddd": 1,
        }
    }
}