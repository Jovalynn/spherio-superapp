import { mkdir,open,unlink } from "node:fs/promises";
import path from "node:path";
export async function publishUploadedFile({db,id,ownerKey,storagePath,buffer,persist}) {
  await mkdir(path.dirname(storagePath), {recursive:true});
  // Only a successfully created exclusive file belongs to this attempt.
  const handle = await open(storagePath,"wx",0o600);
  let insertAttempted=false;
  try {
    await handle.writeFile(buffer); await handle.close();
    insertAttempted=true;
    return await persist();
  } catch(error) {
    await handle.close().catch(()=>{});
    let removable=!insertAttempted;
    if(insertAttempted) {
      try {
        const result=await db.query("SELECT storage_path FROM riomind_files WHERE id=$1 AND owner_key=$2",[id,ownerKey]);
        removable=result.rows.length===0;
      } catch { /* Indeterminate commit: preserve the file for owner reconciliation. */ }
    }
    if(removable) await unlink(storagePath).catch(()=>{});
    throw error;
  }
}
