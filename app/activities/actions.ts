'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * 指定されたIDの活動を削除するサーバーアクション
 * @param activityId 削除する活動のID
 * @returns 成功した場合はリダイレクト、失敗した場合はエラーメッセージを含むオブジェクト
 */
export async function deleteActivity(activityId: string): Promise<{ success: false; message: string } | void> {
  // サーバーサイドでSupabaseクライアントを初期化
  const supabase = await createClient()

  try {
    // Supabaseデータベースから指定されたIDのレコードを削除
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId)

    if (error) {
      // データベースエラーが発生した場合は、エラーを投げる
      throw new Error(`データベースエラー: ${error.message}`)
    }

    // 削除が成功したら、活動一覧ページのキャッシュをクリアして最新の状態を再取得させる
    // これにより、一覧ページに戻ったときに削除した項目が消えていることが保証される
    revalidatePath('/activities') 

  } catch (error) {
    // tryブロック内でエラーが発生した場合の処理
    console.error('活動の削除に失敗しました:', error)
    // エラーメッセージをクライアントに返す
    return {
      success: false,
      message: error instanceof Error ? error.message : '不明なエラーが発生しました。',
    }
  }
  
  // 全ての処理が成功したら、活動一覧ページへリダイレクト
  // redirect()は特殊なエラーを投げるため、必ずtry-catchブロックの外で呼び出す
  redirect('/activities')
}