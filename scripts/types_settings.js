const TYPES = [
    {
        name: "Preview",
        test: "bot/check-settings"
    },
    {
        name: "Vector Database",
        vendor: "database",
        conf: "vector_database",
        test: "database/check-settings",
    },
    {
        name: "Doc Database",
        vendor: "database",
        conf: "doc_database",
        test: "database/check-settings",
    },
    {
        name: "Embedding",
        vendor: "embedding",
        conf: "embedding",
        test: "embedding/check-settings",
    },
    {
        name: "Rerank",
        vendor: "rerank",
        conf: "rerank",
        test: "rerank/check-settings",
    },
    {
        name: "Llm",
        vendor: "llm",
        conf: "llm",
        test: "llm/check-settings",
        additonal_settings: [
            {
                name: "system_prompt",
                type: "long_text",
                description: "System prompt",
            },
            {
                name: "qa_prompt",
                type: "long_text",
                description: "QA prompt",
            }
        ]
    },
    {
        name: "Bot Settings",
        vendor: "bot",
        conf: "bot_settings",
        additonal_settings: [
            {
                name: "main_mode",
                type: "select",
                description: "DB File Register",
                options: [
                    {
                        name: "VECTORSTORE",
                        value: 1,
                    },
                    {
                        name: "DOCSTORE",
                        value: 2,
                    }
                ]
            },
            {
                name: "mode",
                type: "select",
                description: "Retriever Mode",
                options: [
                    {
                        name: "HYBDRID",
                        value: "hybrid"
                    },
                    {
                        name: "SINGLE",
                        value: "single",
                    }
                ]
            },
            {
                name: "mult_top_k",
                type: "number",
                description: "Mult. Top K Search",
                value: 10
            },
            {
                name: "top_history",
                type: "number",
                description: "Top K History",
                value: null,
            },
            {
                name: "add_thumbnail",
                type: "boolean",
                description: "Add Thumbnail",
                value: true
            },
            {
                name: "scorer",
                type: "boolean",
                description: "Scorer",
                value: true
            },
            {
                name: "stream_chunks",
                type: "boolean",
                description: "Stream Chunks",
                value: true
            },
            {
                name: "generate_title",
                type: "boolean",
                description: "Generate Title",
                value: true
            },
            {
                name: "neighbor_top_k",
                type: "number",
                description: "Neighbor Top K",
                value: 2
            },
            {
                name: "neighbor_extends",
                type: "number",
                description: "Neighbor Extends",
                value: 1
            }
        ]
    },
    {
        name: "Scorer",
        conf: "scorer",
        vendor: "scorer",
    },
    {
        name: "Splitter",
        conf: "splitter",
        vendor: "splitter",
    }, 
]