
import { JSX,  } from "react"
import { deleteRequest } from "@renderer/functions/requests"
import {projectDataStore,googleAuthStore, selectUpdateProjects} from "@renderer/store/projectStore"
import { NavLink } from "react-router-dom";
export const DeleteWarning =({on, id, toggleWarning}:{on:boolean, id:string, toggleWarning:()=>void}): JSX.Element =>{   
    const updateProject = projectDataStore(selectUpdateProjects)   
    const userId = googleAuthStore(state=>state.user?.id)
    const deleteRequestAndReset =async():Promise<void>=>{
        if(!userId)return
       await deleteRequest(id, userId)
       await updateProject()     
         toggleWarning()
    }
return(<>
 {on && 
    <div className="delete-warning">
        <div className=" flex colum align">
            <h2>Are you sure you want to Delete this project?</h2>
            <div className="delete-options flex row edit-delete-sec">
                <NavLink state={{save:null}} to="/dashboard/project-ideas">
                    <button onClick={deleteRequestAndReset}>Delete Project</button>
                </NavLink>
                <button onClick={toggleWarning}>Do not Delete Project</button>
            </div>
        </div>
    </div>
    }
</>
    )
}