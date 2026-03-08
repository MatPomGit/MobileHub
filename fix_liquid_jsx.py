import re
from pathlib import Path

CODE_BLOCK_START = re.compile(r"^```(js|ts|tsx|javascript|jsx)", re.IGNORECASE)
CODE_BLOCK_END = re.compile(r"^```$")
JSX_LIQUID = re.compile(r"\{\{|\}\}")

def fix_file(path):
    lines = path.read_text().splitlines()
    output = []

    inside_code = False
    block = []

    for line in lines:

        if CODE_BLOCK_START.match(line) and not inside_code:
            inside_code = True
            block = [line]
            continue

        if inside_code:
            block.append(line)

            if CODE_BLOCK_END.match(line):
                inside_code = False
                block_text = "\n".join(block)

                if JSX_LIQUID.search(block_text):
                    output.append("{% raw %}")
                    output.extend(block)
                    output.append("{% endraw %}")
                else:
                    output.extend(block)

                block = []
            continue

        output.append(line)

    path.write_text("\n".join(output))


def scan_repo(root):
    for md in Path(root).rglob("*.md"):
        fix_file(md)


if __name__ == "__main__":
    scan_repo(".")