"""Independent image protocol; no ASR/GPU imports or background queue."""
import json, os, sys
from pathlib import Path
import photo_evidence
if __name__=='__main__':
    try:
        request=json.load(sys.stdin)
        if request['operation']!='photo_evidence':raise ValueError('Unknown photo operation')
        args=request['args'];root=Path(json.loads(os.environ['DSH_TOOL_CONFIG'])['dataDirectory']).resolve();root.mkdir(parents=True,exist_ok=True)
        print(json.dumps({'result':photo_evidence.dispatch(root,args['action'],args)},ensure_ascii=False))
    except Exception as error:
        print(json.dumps({'error':str(error)},ensure_ascii=False));sys.exit(1)
