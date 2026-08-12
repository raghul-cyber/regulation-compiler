import json

log_path = r"C:\Users\rcrag\.gemini\antigravity-ide\brain\036c24fb-dfba-40c6-9991-8c6a9b48a2aa\.system_generated\logs\transcript_full.jsonl"

found_svelte = False
found_server = False

with open(log_path, 'r', encoding='utf-8') as f:
    # Read backwards or just iterate
    for line in f:
        data = json.loads(line)
        if "tool_calls" in data:
            for tc in data["tool_calls"]:
                if tc.get("name") == "default_api:write_to_file":
                    args = tc["args"]
                    target = args.get("TargetFile", "")
                    if "regulations\\[id]\\+page.svelte" in target or "regulations/[id]/+page.svelte" in target:
                        content = args.get("CodeContent")
                        if "Review Queue" in content or "pending_review" in content or "validation_status" in content:
                            with open(r"c:\Users\rcrag\OneDrive\Desktop\regulater as a code compiler\apps\web\src\routes\(dashboard)\regulations\[id]\requirements\+page.svelte", "w", encoding='utf-8') as out:
                                out.write(content)
                            print("Recovered +page.svelte")
                            
                    if "regulations\\[id]\\+page.server.ts" in target or "regulations/[id]/+page.server.ts" in target:
                        content = args.get("CodeContent")
                        if "requirements" in content and "limit" in content:
                            with open(r"c:\Users\rcrag\OneDrive\Desktop\regulater as a code compiler\apps\web\src\routes\(dashboard)\regulations\[id]\requirements\+page.server.ts", "w", encoding='utf-8') as out:
                                out.write(content)
                            print("Recovered +page.server.ts")

