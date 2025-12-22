
import { CategoriesTypeObjArr, GoalsChecklistType} from "@renderer/types"

export type CompareFormsType = {
    original: {    
        name: string,
        user_id:string,
        description: string,
        categories?: CategoriesTypeObjArr,
         goals_checklist?:GoalsChecklistType,
        completed:boolean
    }
    updated: {
        name: string,
          user_id:string,
        description: string,
        categories?: CategoriesTypeObjArr,
         goals_checklist?:GoalsChecklistType,
        completed:boolean}
    }
export type CompareResults ={
        name?: string,
        user_id:string,
        description?: string,
        categories?: CategoriesTypeObjArr,
        goals_checklist?:GoalsChecklistType,
        completed: boolean, 
    }
export const compareForms=({original,updated}:CompareFormsType):CompareResults=>{
    const fieldsToSend: CompareResults = {completed: updated.completed ?? original.completed, user_id: updated.user_id ?? original.user_id}
    console.log(original, "ORIINAL")
    
    if(original.name !== updated.name) fieldsToSend.name = updated.name
   
    if(original.description !== updated.description) fieldsToSend.description = updated.description
    if(JSON.stringify(updated.categories !== original.categories)) fieldsToSend.categories = updated.categories
    if(JSON.stringify(updated.goals_checklist !== original.goals_checklist)) fieldsToSend.goals_checklist = updated.goals_checklist
    
   return fieldsToSend
}