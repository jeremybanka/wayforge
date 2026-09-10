// A real Cobra executable used only as an independent protocol reference.
package main

import (
	"os"

	"github.com/spf13/cobra"
)

func main() {
	root := &cobra.Command{Use: "cobra-oracle"}
	for _, name := range []string{"state", "base", "token", "input", "directory", "fail"} {
		root.Flags().String(name, "", "Completion fixture")
	}
	root.RegisterFlagCompletionFunc("state", func(*cobra.Command, []string, string) ([]string, cobra.ShellCompDirective) {
		return []string{"closed"}, cobra.ShellCompDirectiveNoFileComp
	})
	root.RegisterFlagCompletionFunc("base", func(*cobra.Command, []string, string) ([]string, cobra.ShellCompDirective) {
		return []string{"main\tMain branch", "maintenance\tMaintenance branch"}, cobra.ShellCompDirectiveNoFileComp
	})
	root.RegisterFlagCompletionFunc("token", func(*cobra.Command, []string, string) ([]string, cobra.ShellCompDirective) {
		return []string{"prefix/"}, cobra.ShellCompDirectiveNoFileComp | cobra.ShellCompDirectiveNoSpace
	})
	root.RegisterFlagCompletionFunc("directory", func(*cobra.Command, []string, string) ([]string, cobra.ShellCompDirective) {
		return nil, cobra.ShellCompDirectiveFilterDirs
	})
	root.RegisterFlagCompletionFunc("fail", func(*cobra.Command, []string, string) ([]string, cobra.ShellCompDirective) {
		return nil, cobra.ShellCompDirectiveNoFileComp
	})
	if err := root.Execute(); err != nil {
		os.Exit(1)
	}
}
