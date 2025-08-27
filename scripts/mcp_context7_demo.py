# scripts/mcp_context7_demo.py
# Simple MCP + context7 demo: start a server with a trivial context
from mcp.server import MCPServer
from context7 import Context

class HelloContext(Context):
    def handle(self, request):
        return {'message': 'Hello from context7!'}

if __name__ == '__main__':
    server = MCPServer(context=HelloContext())
    print('Starting MCP server on http://localhost:8008 ...')
    server.serve(port=8008)
